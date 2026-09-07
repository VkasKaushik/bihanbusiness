import { prisma } from '@/lib/db';
import { CalculationsService } from './calculations.service';
import { InventoryService } from './inventory.service';
import { CustomersService } from './customers.service';
import { DashboardSummary } from '@/types';
import {
  getStartOfISTDay,
  getEndOfISTDay,
  getStartOfISTMonth,
  getISTCurrentDateDisplay,
} from '@/lib/date-utils';

export class DashboardService {
  static async getSummary(): Promise<DashboardSummary> {
    const now = new Date();
    // Strict Indian Standard Time (Asia/Kolkata) boundaries
    const startOfTodayIST = getStartOfISTDay(now);
    const endOfTodayIST = getEndOfISTDay(now);
    const startOfMonthIST = getStartOfISTMonth(now);

    // 1. TODAY'S SALES (Strict IST Date Range)
    const todaySalesAgg = await prisma.sale.aggregate({
      where: {
        date: { gte: startOfTodayIST, lte: endOfTodayIST },
        isArchived: false,
      },
      _sum: { totalAmount: true },
      _count: true,
    });

    // 2. TODAY'S COLLECTIONS (Customer Payments in IST)
    const todayCollectionsAgg = await prisma.customerPayment.aggregate({
      where: {
        paymentDate: { gte: startOfTodayIST, lte: endOfTodayIST },
      },
      _sum: { amount: true },
      _count: true,
    });

    // 3. TODAY'S EXPENSES (in IST)
    const todayExpensesAgg = await prisma.expense.aggregate({
      where: {
        date: { gte: startOfTodayIST, lte: endOfTodayIST },
      },
      _sum: { amount: true },
      _count: true,
    });

    // 4. THIS MONTH: Sales & Orders
    const monthSalesAgg = await prisma.sale.aggregate({
      where: {
        date: { gte: startOfMonthIST, lte: endOfTodayIST },
        isArchived: false,
      },
      _sum: { totalAmount: true },
      _count: true,
    });

    // 5. THIS MONTH: Estimated Profit
    const profitData = await CalculationsService.getEstimatedProfit(
      startOfMonthIST,
      endOfTodayIST
    );

    // 6. CUSTOMER DUE & TOP DEBTORS
    const customerSummaries = await CustomersService.getCustomerSummaries();
    let totalCustomerDue = 0;
    const pendingCustomerPayments: Array<{
      customerId: string;
      name: string;
      businessName: string | null;
      phone: string;
      outstandingBalance: number;
    }> = [];

    for (const cust of customerSummaries) {
      if (cust.outstandingBalance > 0) {
        totalCustomerDue += cust.outstandingBalance;
        pendingCustomerPayments.push({
          customerId: cust.id,
          name: cust.name,
          businessName: cust.businessName,
          phone: cust.phone,
          outstandingBalance: cust.outstandingBalance,
        });
      }
    }

    // Sort debtors by highest outstanding first
    pendingCustomerPayments.sort(
      (a, b) => b.outstandingBalance - a.outstandingBalance
    );

    // 7. INVENTORY & LOW STOCK ALERTS
    const productStocks = await InventoryService.getProductStockList();
    const lowStockItems = productStocks
      .filter((p) => p.isLowStock)
      .map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        currentStock: p.currentStock,
        minAlertLevel: p.minStockAlertLevel,
        imageEmoji: p.imageEmoji,
      }));

    // 8. SUPPLIER DUE
    const supplierBalances = await CalculationsService.getSupplierBalances();

    // 9. LIQUID MONEY BALANCES
    const balances = await CalculationsService.getMoneyBalances();

    // 10. RECENT 5 SALES
    const recentSales = await prisma.sale.findMany({
      where: { isArchived: false },
      include: {
        customer: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
      take: 5,
    });

    // 11. FOUNDER EXPENSE SPLIT
    const businessExpensesAgg = await prisma.expense.aggregate({
      where: {
        paymentSource: { in: ['BUSINESS_CASH', 'BUSINESS_BANK'] },
      },
      _sum: { amount: true },
    });
    const founderSettlement = await CalculationsService.getFounderSettlementSummary();

    return {
      todayDateDisplay: getISTCurrentDateDisplay(),
      todaySalesAmount: todaySalesAgg._sum.totalAmount || 0,
      todaySalesCount: todaySalesAgg._count || 0,
      todayCollectionsAmount: todayCollectionsAgg._sum.amount || 0,
      todayCollectionsCount: todayCollectionsAgg._count || 0,
      todayExpensesAmount: todayExpensesAgg._sum.amount || 0,
      todayExpensesCount: todayExpensesAgg._count || 0,
      totalCustomerDue,
      totalCustomersWithDue: pendingCustomerPayments.length,
      monthSalesAmount: monthSalesAgg._sum.totalAmount || 0,
      monthOrdersCount: monthSalesAgg._count || 0,
      monthEstimatedProfit: profitData.netEstimatedProfit,
      lowStockCount: lowStockItems.length,
      lowStockItems,
      pendingCustomerPayments: pendingCustomerPayments.slice(0, 5),
      supplierDueAmount: supplierBalances.totalSupplierDue,
      supplierDueCount: supplierBalances.suppliersCount,
      cashOnHand: balances.cashOnHand,
      bankBalance: balances.bankBalance,
      upiBalance: balances.upiBalance,
      totalAvailableMoney: balances.totalAvailableMoney,
      recentSales: recentSales.map((s) => ({
        id: s.id,
        saleNumber: s.saleNumber,
        customerId: s.customer.id,
        customerName: s.customer.name,
        totalAmount: s.totalAmount,
        paidAmount: s.paidAmount,
        paymentStatus: s.paymentStatus,
        createdAt: s.date.toISOString(),
      })),
      founderExpenseSplit: {
        businessPaid: businessExpensesAgg._sum.amount || 0,
        founderPaid: founderSettlement.businessOwesFounders,
        settlementMessage: founderSettlement.settlementMessage,
        details: founderSettlement.details,
      },
    };
  }
}

