import { prisma } from '@/lib/db';

export class CalculationsService {
  /**
   * 1. Calculate Single Customer Outstanding
   * Formula: Total Billed Sales - Total Collections
   */
  static async getCustomerOutstanding(customerId: string): Promise<number> {
    const salesTotal = await prisma.sale.aggregate({
      where: { customerId, isArchived: false },
      _sum: { totalAmount: true },
    });

    const paymentsTotal = await prisma.customerPayment.aggregate({
      where: { customerId },
      _sum: { amount: true },
    });

    const totalBilled = salesTotal._sum.totalAmount || 0;
    const totalPaid = paymentsTotal._sum.amount || 0;

    return Math.max(0, totalBilled - totalPaid);
  }

  /**
   * 2. Calculate All Customer Balances
   */
  static async getAllCustomerBalances(): Promise<
    Map<string, { totalPurchased: number; totalPaid: number; outstanding: number }>
  > {
    const sales = await prisma.sale.groupBy({
      by: ['customerId'],
      where: { isArchived: false },
      _sum: { totalAmount: true },
    });

    const payments = await prisma.customerPayment.groupBy({
      by: ['customerId'],
      _sum: { amount: true },
    });

    const balanceMap = new Map<
      string,
      { totalPurchased: number; totalPaid: number; outstanding: number }
    >();

    for (const s of sales) {
      const totalPurchased = s._sum.totalAmount || 0;
      balanceMap.set(s.customerId, {
        totalPurchased,
        totalPaid: 0,
        outstanding: totalPurchased,
      });
    }

    for (const p of payments) {
      const totalPaid = p._sum.amount || 0;
      const existing = balanceMap.get(p.customerId);
      if (existing) {
        existing.totalPaid = totalPaid;
        existing.outstanding = Math.max(0, existing.totalPurchased - totalPaid);
      } else {
        balanceMap.set(p.customerId, {
          totalPurchased: 0,
          totalPaid,
          outstanding: -totalPaid,
        });
      }
    }

    return balanceMap;
  }

  /**
   * 3. Calculate Stock on Hand for a Product
   * Formula: Algebraic sum of all verified StockMovements (+ and -)
   */
  static async getStockOnHand(productId: string): Promise<number> {
    const movements = await prisma.stockMovement.aggregate({
      where: { productId },
      _sum: { quantityChange: true },
    });
    return Math.round(movements._sum.quantityChange || 0);
  }

  /**
   * 4. Calculate Stock on Hand for all Products
   */
  static async getAllStockOnHand(): Promise<Map<string, number>> {
    const movements = await prisma.stockMovement.groupBy({
      by: ['productId'],
      _sum: { quantityChange: true },
    });

    const stockMap = new Map<string, number>();
    for (const m of movements) {
      stockMap.set(m.productId, Math.round(m._sum.quantityChange || 0));
    }
    return stockMap;
  }

  /**
   * 5. Calculate Supplier Outstanding (Total Purchases - Total Payments)
   */
  static async getSupplierBalances(): Promise<{
    totalSupplierDue: number;
    suppliersCount: number;
  }> {
    const purchases = await prisma.purchase.aggregate({
      _sum: { totalAmount: true },
    });

    const payments = await prisma.supplierPayment.aggregate({
      _sum: { amount: true },
    });

    const totalBilled = purchases._sum.totalAmount || 0;
    const totalPaid = payments._sum.amount || 0;
    const totalSupplierDue = Math.max(0, totalBilled - totalPaid);

    // Count suppliers with outstanding
    const suppliers = await prisma.supplier.findMany({
      where: { isActive: true },
      include: {
        purchases: { select: { totalAmount: true } },
        payments: { select: { amount: true } },
      },
    });

    let suppliersCount = 0;
    for (const s of suppliers) {
      const billed = s.purchases.reduce((acc, p) => acc + p.totalAmount, 0);
      const paid = s.payments.reduce((acc, p) => acc + p.amount, 0);
      if (billed - paid > 0) suppliersCount++;
    }

    return { totalSupplierDue, suppliersCount };
  }

  /**
   * 6. Calculate Liquid Money Balances
   */
  static async getMoneyBalances(): Promise<{
    cashOnHand: number;
    bankBalance: number;
    upiBalance: number;
    totalAvailableMoney: number;
  }> {
    // Inflows from customer collections
    const cashInflow = await prisma.customerPayment.aggregate({
      where: { paymentMethod: 'CASH' },
      _sum: { amount: true },
    });

    const upiInflow = await prisma.customerPayment.aggregate({
      where: { paymentMethod: 'UPI' },
      _sum: { amount: true },
    });

    const bankInflow = await prisma.customerPayment.aggregate({
      where: { paymentMethod: { in: ['BANK_TRANSFER', 'CHEQUE'] } },
      _sum: { amount: true },
    });

    // Outflows from business expenses
    const cashExpenses = await prisma.expense.aggregate({
      where: { paymentSource: 'BUSINESS_CASH' },
      _sum: { amount: true },
    });

    const bankExpenses = await prisma.expense.aggregate({
      where: { paymentSource: 'BUSINESS_BANK' },
      _sum: { amount: true },
    });

    // Outflows from supplier disbursements
    const cashSupplier = await prisma.supplierPayment.aggregate({
      where: { paymentSource: 'BUSINESS_CASH' },
      _sum: { amount: true },
    });

    const bankSupplier = await prisma.supplierPayment.aggregate({
      where: { paymentSource: 'BUSINESS_BANK' },
      _sum: { amount: true },
    });

    const cashOnHand = Math.max(
      0,
      (cashInflow._sum.amount || 0) -
        (cashExpenses._sum.amount || 0) -
        (cashSupplier._sum.amount || 0)
    );

    const upiBalance = Math.max(0, upiInflow._sum.amount || 0);

    const bankBalance = Math.max(
      0,
      (bankInflow._sum.amount || 0) -
        (bankExpenses._sum.amount || 0) -
        (bankSupplier._sum.amount || 0)
    );

    const totalAvailableMoney = cashOnHand + upiBalance + bankBalance;

    return {
      cashOnHand,
      bankBalance,
      upiBalance,
      totalAvailableMoney,
    };
  }

  /**
   * 7. Calculate Founder Personal Expense Balances
   */
  static async getFounderSettlementSummary(): Promise<{
    businessOwesFounders: number;
    settlementMessage: string;
    details: Array<{ founderName: string; paidPersonally: number }>;
  }> {
    const users = await prisma.user.findMany({
      where: { role: 'FOUNDER' },
      select: { id: true, name: true, username: true },
    });

    let totalFounderPersonal = 0;
    const details: Array<{ founderName: string; paidPersonally: number }> = [];

    for (const u of users) {
      const expenses = await prisma.expense.aggregate({
        where: {
          paidByUserId: u.id,
          paymentSource: 'FOUNDER_PERSONAL',
        },
        _sum: { amount: true },
      });

      const paid = expenses._sum.amount || 0;
      totalFounderPersonal += paid;
      details.push({
        founderName: u.name,
        paidPersonally: paid,
      });
    }

    let settlementMessage = 'All settled ✓';
    if (details.length >= 2) {
      const diff = details[0].paidPersonally - details[1].paidPersonally;
      if (diff > 0) {
        settlementMessage = `${details[1].founderName} owes ${details[0].founderName} ₹${Math.round(diff / 2).toLocaleString('en-IN')}`;
      } else if (diff < 0) {
        settlementMessage = `${details[0].founderName} owes ${details[1].founderName} ₹${Math.round(Math.abs(diff) / 2).toLocaleString('en-IN')}`;
      }
    }

    return {
      businessOwesFounders: totalFounderPersonal,
      settlementMessage,
      details,
    };
  }

  /**
   * 8. Calculate Estimated Profit in Date Range
   * Formula: Sum(Quantity * (SellingPrice - CostSnapshot)) - Expenses
   */
  static async getEstimatedProfit(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    revenue: number;
    costOfGoods: number;
    grossProfit: number;
    expenses: number;
    netEstimatedProfit: number;
  }> {
    const saleFilter: any = { isArchived: false };
    const expenseFilter: any = {};

    if (startDate && endDate) {
      saleFilter.date = { gte: startDate, lte: endDate };
      expenseFilter.date = { gte: startDate, lte: endDate };
    }

    const saleItems = await prisma.saleItem.findMany({
      where: {
        sale: saleFilter,
      },
      select: {
        quantity: true,
        unitPrice: true,
        unitCostSnapshot: true,
        lineTotal: true,
      },
    });

    let revenue = 0;
    let costOfGoods = 0;

    for (const item of saleItems) {
      revenue += item.lineTotal;
      costOfGoods += item.quantity * item.unitCostSnapshot;
    }

    const grossProfit = revenue - costOfGoods;

    const expensesAgg = await prisma.expense.aggregate({
      where: expenseFilter,
      _sum: { amount: true },
    });

    const expenses = expensesAgg._sum.amount || 0;
    const netEstimatedProfit = grossProfit - expenses;

    return {
      revenue,
      costOfGoods,
      grossProfit,
      expenses,
      netEstimatedProfit,
    };
  }
}
