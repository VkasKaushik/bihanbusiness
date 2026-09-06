import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/server/auth/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const expenses = await prisma.expense.findMany({
      include: {
        category: { select: { id: true, name: true } },
        paidByUser: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
      take: 50,
    });

    const categories = await prisma.expenseCategory.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ expenses, categories });
  } catch (error: any) {
    console.error('Fetch expenses error:', error);
    return NextResponse.json({ error: error?.message || 'Error fetching expenses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    if (!body.amount || Number(body.amount) <= 0) {
      return NextResponse.json({ error: 'Valid expense amount is required' }, { status: 400 });
    }

    if (!body.description) {
      return NextResponse.json({ error: 'Expense description is required' }, { status: 400 });
    }

    // Default category fallback if not provided
    let categoryId = body.categoryId;
    if (!categoryId) {
      const defaultCategory = await prisma.expenseCategory.findFirst({
        where: { name: 'Other' },
      });
      if (defaultCategory) categoryId = defaultCategory.id;
    }

    const expense = await prisma.expense.create({
      data: {
        categoryId,
        amount: Number(body.amount),
        description: body.description.trim(),
        paidByUserId: body.paidByUserId || user.id,
        paymentSource: body.paymentSource || 'BUSINESS_CASH',
        date: body.date ? new Date(body.date) : new Date(),
        receiptUrl: body.receiptUrl || null,
      },
    });

    return NextResponse.json({ success: true, expense });
  } catch (error: any) {
    console.error('Create expense error:', error);
    return NextResponse.json({ error: error?.message || 'Error creating expense' }, { status: 400 });
  }
}
