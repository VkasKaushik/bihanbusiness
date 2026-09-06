import { prisma } from '@/lib/db';
import { CalculationsService } from './calculations.service';
import { ProductStockSummary } from '@/types';

export class InventoryService {
  static async getProductStockList(): Promise<ProductStockSummary[]> {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    const stockMap = await CalculationsService.getAllStockOnHand();

    return products.map((prod) => {
      const currentStock = stockMap.get(prod.id) ?? 0;
      return {
        id: prod.id,
        sku: prod.sku,
        name: prod.name,
        category: prod.category,
        packSizeLitres: prod.packSizeLitres,
        mrp: prod.mrp,
        currentSellingPrice: prod.currentSellingPrice,
        currentEstimatedCost: prod.currentEstimatedCost,
        currentStock,
        minStockAlertLevel: prod.minStockAlertLevel,
        imageEmoji: prod.imageEmoji,
        isLowStock: currentStock <= prod.minStockAlertLevel,
      };
    });
  }

  static async getMovements(limit = 100) {
    return prisma.stockMovement.findMany({
      include: {
        product: {
          select: { id: true, name: true, sku: true, packSizeLitres: true, imageEmoji: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
