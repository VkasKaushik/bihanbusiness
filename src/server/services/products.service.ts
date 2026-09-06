import { prisma } from '@/lib/db';
import { InventoryService } from './inventory.service';

export class ProductsService {
  static async getProducts() {
    return InventoryService.getProductStockList();
  }

  static async updateProductPricing(
    id: string,
    data: {
      mrp?: number;
      currentSellingPrice?: number;
      currentEstimatedCost?: number;
      minStockAlertLevel?: number;
    }
  ) {
    return prisma.product.update({
      where: { id },
      data,
    });
  }
}
