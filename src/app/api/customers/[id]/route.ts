import { NextResponse } from 'next/server';
import { CustomersService } from '@/server/services/customers.service';
import { getCurrentUser } from '@/server/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    const customer = await CustomersService.getCustomerById(id);
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error: any) {
    console.error('Fetch customer details error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error fetching customer details' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const text = body.text?.trim();

    if (!text) {
      return NextResponse.json({ error: 'Note text cannot be empty' }, { status: 400 });
    }

    const updatedNotes = await CustomersService.addCustomerNote(id, text, user.name);

    return NextResponse.json({ success: true, notes: updatedNotes });
  } catch (error: any) {
    console.error('Add customer note error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error adding note' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    await CustomersService.deleteCustomer(id);

    return NextResponse.json({ success: true, message: 'Customer removed successfully' });
  } catch (error: any) {
    console.error('Delete customer error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error deleting customer' },
      { status: 400 }
    );
  }
}

