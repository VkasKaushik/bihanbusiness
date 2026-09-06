import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/server/auth/session';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    if (!body.productId || !body.quantityChange || Number(body.quantityChange) === 0) {
      return NextResponse.json({ error: 'Product and non-zero quantity change are required' }, { status: 400 });
    }

    const movement = await prisma.stockMovement.create({
      data: {
        productId: body.productId,
        quantityChange: Number(body.quantityChange),
        movementType: body.movementType || 'ADJUSTMENT',
        notes: body.notes || `Stock adjusted by ${user.name}`,
      },
    });

    return NextResponse.json({ success: true, movement });
  } catch (error: any) {
    console.error('Stock adjustment error:', error);
    return NextResponse.json({ error: error?.message || 'Error updating stock' }, { status: 400 });
  }
}
