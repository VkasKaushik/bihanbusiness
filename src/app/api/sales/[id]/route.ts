import { NextResponse } from 'next/server';
import { SalesService } from '@/server/services/sales.service';
import { getCurrentUser } from '@/server/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;
    if (!id) {
      return NextResponse.json({ error: 'Sale ID is required' }, { status: 400 });
    }

    const sale = await SalesService.getSaleById(id);
    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    return NextResponse.json(sale);
  } catch (error: any) {
    console.error('Fetch sale details error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error fetching sale details' },
      { status: 500 }
    );
  }
}
