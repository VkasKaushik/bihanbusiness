import { prisma } from '@/lib/db';
import { CalculationsService } from './calculations.service';

export interface CreateSaleItemDto {
  productId: string;
  quantity: number;
  unitPrice?: number; // Optional override; defaults to Product.currentSellingPrice
}

export interface CreateSaleDto {
  customerId: string;
  items: CreateSaleItemDto[];
  discountAmount?: number;
  paidAmount?: number; // Upfront collection
  paymentMethod?: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE';
  notes?: string;
  createdById?: string;
  date?: string | Date;
}

export class SalesService {
  static async createSale(dto: CreateSaleDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new Error('At least one product item is required for a sale.');
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Fetch products & verify stock
      const productIds = dto.items.map((i) => i.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      const productMap = new Map(products.map((p) => [p.id, p]));

      // 2. Prepare line items with cost snapshot & price
      let subtotal = 0;
      const saleItemsData: Array<{
        productId: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
        unitCostSnapshot: number;
      }> = [];

      for (const item of dto.items) {
        const prod = productMap.get(item.productId);
        if (!prod) {
          throw new Error(`Product with ID ${item.productId} not found.`);
        }
        if (item.quantity <= 0) {
          throw new Error(`Quantity for ${prod.name} must be greater than 0.`);
        }

        const unitPrice = item.unitPrice ?? prod.currentSellingPrice;
        const lineTotal = unitPrice * item.quantity;
        subtotal += lineTotal;

        saleItemsData.push({
          productId: prod.id,
          quantity: item.quantity,
          unitPrice,
          lineTotal,
          unitCostSnapshot: prod.currentEstimatedCost,
        });
      }

      const discount = dto.discountAmount ?? 0;
      const totalAmount = Math.max(0, subtotal - discount);
      const paidAmount = Math.min(totalAmount, Math.max(0, dto.paidAmount ?? 0));

      let paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' = 'UNPAID';
      if (paidAmount >= totalAmount && totalAmount > 0) {
        paymentStatus = 'PAID';
      } else if (paidAmount > 0) {
        paymentStatus = 'PARTIALLY_PAID';
      }

      // Generate unique Sale Number (e.g. SAL-2026-0001)
      const count = await tx.sale.count();
      const year = new Date().getFullYear();
      const saleNumber = `SAL-${year}-${String(count + 1).padStart(4, '0')}`;

      // 3. Create Sale record
      const sale = await tx.sale.create({
        data: {
          saleNumber,
          customerId: dto.customerId,
          date: dto.date ? new Date(dto.date) : new Date(),
          subtotalAmount: subtotal,
          discountAmount: discount,
          totalAmount,
          paymentStatus,
          paidAmount,
          notes: dto.notes,
          createdById: dto.createdById,
        },
      });

      // 4. Create SaleItems
      for (const itemData of saleItemsData) {
        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            ...itemData,
          },
        });

        // 5. Atomic Stock Movement: Outward decrement
        await tx.stockMovement.create({
          data: {
            productId: itemData.productId,
            quantityChange: -itemData.quantity,
            movementType: 'SALE',
            referenceId: sale.id,
            notes: `Sale #${sale.saleNumber}`,
          },
        });
      }

      // 6. If upfront payment collected, create CustomerPayment record
      if (paidAmount > 0) {
        const paymentCount = await tx.customerPayment.count();
        const paymentNumber = `PAY-${year}-${String(paymentCount + 1).padStart(4, '0')}`;

        await tx.customerPayment.create({
          data: {
            paymentNumber,
            customerId: dto.customerId,
            saleId: sale.id,
            amount: paidAmount,
            paymentDate: dto.date ? new Date(dto.date) : new Date(),
            paymentMethod: dto.paymentMethod ?? 'CASH',
            recordedById: dto.createdById,
            notes: `Upfront collection on Sale #${sale.saleNumber}`,
          },
        });
      }

      return sale;
    });
  }

  static async getSales(limit = 50) {
    return prisma.sale.findMany({
      where: { isArchived: false },
      include: {
        customer: { select: { id: true, name: true, businessName: true, phone: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, imageEmoji: true } },
          },
        },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
      take: limit,
    });
  }

  static async deleteSale(saleId: string) {
    return await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: { items: true },
      });

      if (!sale) {
        throw new Error('Sale not found');
      }

      // 1. Revert stock deductions: remove stock movements created for this sale
      await tx.stockMovement.deleteMany({
        where: { referenceId: sale.id },
      });

      // 2. Delete linked upfront payments recorded for this sale
      await tx.customerPayment.deleteMany({
        where: { saleId: sale.id },
      });

      // 3. Mark sale as archived
      return await tx.sale.update({
        where: { id: sale.id },
        data: { isArchived: true },
      });
    });
  }
}
