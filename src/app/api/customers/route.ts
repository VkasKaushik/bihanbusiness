import { NextResponse } from 'next/server';
import { CustomersService } from '@/server/services/customers.service';
import { getCurrentUser } from '@/server/auth/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customers = await CustomersService.getCustomerSummaries();
    return NextResponse.json(customers);
  } catch (error: any) {
    console.error('Fetch customers error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error fetching customers' },
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

    if (!body.name || !body.phone) {
      return NextResponse.json(
        { error: 'Customer name and phone number are required' },
        { status: 400 }
      );
    }

    const customer = await CustomersService.createCustomer({
      name: body.name,
      businessName: body.businessName,
      phone: body.phone,
      city: body.city,
      address: body.address,
    });

    return NextResponse.json({ success: true, customer });
  } catch (error: any) {
    console.error('Create customer error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error creating customer' },
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
