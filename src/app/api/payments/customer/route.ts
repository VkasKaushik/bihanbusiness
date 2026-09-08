import { NextResponse } from 'next/server';
import { PaymentsService } from '@/server/services/payments.service';
import { getCurrentUser } from '@/server/auth/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payments = await PaymentsService.getPayments();
    return NextResponse.json(payments);
  } catch (error: any) {
    console.error('Fetch payments error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error fetching payments' },
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

    if (!body.customerId || !body.amount) {
      return NextResponse.json(
        { error: 'Customer and payment amount are required' },
        { status: 400 }
      );
    }

    const payment = await PaymentsService.recordCustomerPayment({
      customerId: body.customerId,
      amount: Number(body.amount),
      paymentMethod: body.paymentMethod || 'UPI',
      referenceNumber: body.referenceNumber,
      notes: body.notes,
      paymentDate: body.paymentDate,
      recordedById: user.id,
      saleId: body.saleId,
    });

    return NextResponse.json({ success: true, payment });
  } catch (error: any) {
    console.error('Record payment error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error recording payment' },
      { status: 400 }
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
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    await PaymentsService.deleteCustomerPayment(id);
    return NextResponse.json({ success: true, message: 'Payment transaction deleted successfully' });
  } catch (error: any) {
    console.error('Delete payment error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error deleting payment' },
      { status: 400 }
    );
  }
}
