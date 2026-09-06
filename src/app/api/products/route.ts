import { NextResponse } from 'next/server';
import { ProductsService } from '@/server/services/products.service';
import { getCurrentUser } from '@/server/auth/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const products = await ProductsService.getProducts();
    return NextResponse.json(products);
  } catch (error: any) {
    console.error('Fetch products error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error fetching products' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'FOUNDER') {
      return NextResponse.json({ error: 'Unauthorized founder action' }, { status: 403 });
    }

    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const updated = await ProductsService.updateProductPricing(body.id, {
      mrp: body.mrp !== undefined ? Number(body.mrp) : undefined,
      currentSellingPrice:
        body.currentSellingPrice !== undefined
          ? Number(body.currentSellingPrice)
          : undefined,
      currentEstimatedCost:
        body.currentEstimatedCost !== undefined
          ? Number(body.currentEstimatedCost)
          : undefined,
      minStockAlertLevel:
        body.minStockAlertLevel !== undefined
          ? Number(body.minStockAlertLevel)
          : undefined,
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    console.error('Update product error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error updating product' },
      { status: 400 }
    );
  }
}
