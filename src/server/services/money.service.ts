import { prisma } from '@/lib/db';
import { CalculationsService } from './calculations.service';
import { CustomersService } from './customers.service';
import { MoneyOverview } from '@/types';
import { getStartOfISTDay, getEndOfISTDay } from '@/lib/date-utils';

export class MoneyService {
  static async getOverview(): Promise<MoneyOverview> {
    const now = new Date();
    const startOfTodayIST = getStartOfISTDay(now);
    const endOfTodayIST = getEndOfISTDay(now);

    // 1. Available Money
    const balances = await CalculationsService.getMoneyBalances();

    // 2. Customer Money
    const customerSummaries = await CustomersService.getCustomerSummaries();
    let totalCustomerDue = 0;
    const topDebtors: Array<{
      id: string;
      name: string;
      businessName: string | null;
      phone: string;
      outstandingBalance: number;
    }> = [];

    for (const c of customerSummaries) {
      if (c.outstandingBalance > 0) {
        totalCustomerDue += c.outstandingBalance;
        topDebtors.push({
          id: c.id,
          name: c.name,
          businessName: c.businessName,
          phone: c.phone,
          outstandingBalance: c.outstandingBalance,
        });
      }
    }

    topDebtors.sort((a, b) => b.outstandingBalance - a.outstandingBalance);

    // 3. Supplier Money
    const supplierBalances = await CalculationsService.getSupplierBalances();

    // 4. Founder Money
    const founderSummary = await CalculationsService.getFounderSettlementSummary();

    // 5. Today's Inflows & Outflows
    const todayCollectionsAgg = await prisma.customerPayment.aggregate({
      where: {
        paymentDate: { gte: startOfTodayIST, lte: endOfTodayIST },
      },
      _sum: { amount: true },
    });

    const todayExpensesAgg = await prisma.expense.aggregate({
      where: {
        date: { gte: startOfTodayIST, lte: endOfTodayIST },
      },
      _sum: { amount: true },
    });

    // 6. Recent Money Transactions (Payments + Expenses)
    const recentPayments = await prisma.customerPayment.findMany({
      include: { customer: { select: { name: true } } },
      orderBy: { paymentDate: 'desc' },
      take: 10,
    });

    const recentExpenses = await prisma.expense.findMany({
      include: { category: { select: { name: true } }, paidByUser: { select: { name: true } } },
      orderBy: { date: 'desc' },
      take: 10,
    });

    const txList: Array<{
      id: string;
      type: 'COLLECTION' | 'EXPENSE' | 'SETTLEMENT';
      title: string;
      subtitle: string;
      amount: number;
      method: string;
      date: string;
    }> = [];

    for (const p of recentPayments) {
      txList.push({
        id: p.id,
        type: 'COLLECTION',
        title: `Received from ${p.customer.name}`,
        subtitle: p.notes || p.paymentNumber,
        amount: p.amount,
        method: p.paymentMethod,
        date: p.paymentDate.toISOString(),
      });
    }

    for (const e of recentExpenses) {
      txList.push({
        id: e.id,
        type: 'EXPENSE',
        title: `${e.category.name}: ${e.description}`,
        subtitle: `Paid by ${e.paidByUser.name} • ${e.paymentSource}`,
        amount: e.amount,
        method: e.paymentSource,
        date: e.date.toISOString(),
      });
    }

    txList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      availableMoney: {
        cash: balances.cashOnHand,
        bank: balances.bankBalance,
        upi: balances.upiBalance,
        other: 0,
        total: balances.totalAvailableMoney,
      },
      customerMoney: {
        totalCustomerDue,
        debtorsCount: topDebtors.length,
        topDebtors: topDebtors.slice(0, 10),
      },
      supplierMoney: {
        totalSupplierDue: supplierBalances.totalSupplierDue,
        suppliersCount: supplierBalances.suppliersCount,
      },
      founderMoney: {
        businessOwesFounders: founderSummary.businessOwesFounders,
        settlementMessage: founderSummary.settlementMessage,
        details: founderSummary.details,
      },
      todayMetrics: {
        collections: todayCollectionsAgg._sum.amount || 0,
        expenses: todayExpensesAgg._sum.amount || 0,
      },
      recentTransactions: txList.slice(0, 15),
    };
  }
}
