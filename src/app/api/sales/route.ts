import { NextResponse } from 'next/server';
import { SalesService } from '@/server/services/sales.service';
import { getCurrentUser } from '@/server/auth/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sales = await SalesService.getSales();
    return NextResponse.json(sales);
  } catch (error: any) {
    console.error('Fetch sales error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error fetching sales' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.customerId) {
      return NextResponse.json({ error: 'Customer is required' }, { status: 400 });
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'At least one product item is required' },
        { status: 400 }
      );
    }

    const sale = await SalesService.createSale({
      customerId: body.customerId,
      items: body.items,
      discountAmount: Number(body.discountAmount) || 0,
      paidAmount: Number(body.paidAmount) || 0,
      paymentMethod: body.paymentMethod || 'CASH',
      notes: body.notes,
      createdById: user.id,
      date: body.date,
    });

    return NextResponse.json({ success: true, sale });
  } catch (error: any) {
    console.error('Create sale error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error recording sale' },
      { status: 400 }
    );
  }
}
