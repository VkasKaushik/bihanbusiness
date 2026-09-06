import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/server/auth/session';
import { CalculationsService } from '@/server/services/calculations.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Total paid by business (BUSINESS_CASH or BUSINESS_BANK)
    const businessExpensesAgg = await prisma.expense.aggregate({
      where: {
        paymentSource: { in: ['BUSINESS_CASH', 'BUSINESS_BANK'] },
      },
      _sum: { amount: true },
    });

    // 2. Total paid personally by founder
    const founderPersonalAgg = await prisma.expense.aggregate({
      where: {
        paymentSource: 'FOUNDER_PERSONAL',
      },
      _sum: { amount: true },
    });

    // 3. Total reimbursed (isSettled: true for FOUNDER_PERSONAL)
    const reimbursedAgg = await prisma.expense.aggregate({
      where: {
        paymentSource: 'FOUNDER_PERSONAL',
        isSettled: true,
      },
      _sum: { amount: true },
    });

    const totalPaidPersonally = founderPersonalAgg._sum.amount || 0;
    const totalReimbursed = reimbursedAgg._sum.amount || 0;
    const totalBusinessOwesFounder = Math.max(0, totalPaidPersonally - totalReimbursed);
    const totalPaidByBusiness = businessExpensesAgg._sum.amount || 0;

    // 4. Founder 50/50 settlement split summary
    const settlementSummary = await CalculationsService.getFounderSettlementSummary();

    // 5. Complete expense / settlement transactions history
    const expenses = await prisma.expense.findMany({
      include: {
        category: { select: { id: true, name: true } },
        paidByUser: { select: { id: true, name: true, username: true } },
      },
      orderBy: { date: 'desc' },
    });

    const transactions = expenses.map((e) => {
      let settlementStatus = 'Business Expense';
      if (e.paymentSource === 'FOUNDER_PERSONAL') {
        settlementStatus = e.isSettled ? 'Reimbursed' : 'Pending Reimbursement';
      }

      let paymentMethodLabel = 'Business Cash';
      if (e.paymentSource === 'BUSINESS_BANK') {
        paymentMethodLabel = 'Business Bank / UPI';
      } else if (e.paymentSource === 'FOUNDER_PERSONAL') {
        paymentMethodLabel = 'Founder Personal';
      }

      return {
        id: e.id,
        date: e.date.toISOString(),
        amount: e.amount,
        category: e.category.name,
        paidBy: e.paidByUser.name,
        paidByUsername: e.paidByUser.username,
        paymentSource: e.paymentSource,
        paymentMethodLabel,
        notes: e.description || null,
        receiptUrl: e.receiptUrl,
        isSettled: e.isSettled,
        settlementStatus,
      };
    });

    return NextResponse.json({
      summary: {
        totalPaidByBusiness,
        totalPaidPersonally,
        totalBusinessOwesFounder,
        totalReimbursed,
        settlementMessage: settlementSummary.settlementMessage,
        founderBreakdown: settlementSummary.details,
      },
      transactions,
    });
  } catch (error: any) {
    console.error('Founder expenses error:', error);
    return NextResponse.json(
      { error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    // Check Expense table
    const expense = await prisma.expense.findUnique({ where: { id } });
    if (expense) {
      await prisma.expense.delete({ where: { id } });
      return NextResponse.json({ success: true, message: 'Transaction removed successfully' });
    }

    // Check FounderSettlement table
    const settlement = await prisma.founderSettlement.findUnique({ where: { id } });
    if (settlement) {
      await prisma.founderSettlement.delete({ where: { id } });
      return NextResponse.json({ success: true, message: 'Settlement removed successfully' });
    }

    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
  } catch (error: any) {
    console.error('Delete founder transaction error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to remove transaction' },
      { status: 500 }
    );
  }
}
