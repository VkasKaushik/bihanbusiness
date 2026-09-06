import { NextResponse } from 'next/server';
import { InventoryService } from '@/server/services/inventory.service';
import { getCurrentUser } from '@/server/auth/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stockList = await InventoryService.getProductStockList();
    return NextResponse.json(stockList);
  } catch (error: any) {
    console.error('Fetch inventory error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error fetching inventory' },
      { status: 500 }
    );
  }
}
