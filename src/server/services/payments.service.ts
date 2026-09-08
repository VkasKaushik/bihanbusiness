import { prisma } from '@/lib/db';

export interface CreateCustomerPaymentDto {
  customerId: string;
  amount: number;
  paymentMethod: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE';
  referenceNumber?: string;
  notes?: string;
  paymentDate?: string | Date;
  recordedById?: string;
  saleId?: string;
}

export class PaymentsService {
  static async recordCustomerPayment(dto: CreateCustomerPaymentDto) {
    if (dto.amount <= 0) {
      throw new Error('Payment amount must be greater than 0.');
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Verify customer exists
      const customer = await tx.customer.findUnique({
        where: { id: dto.customerId },
      });
      if (!customer) {
        throw new Error('Customer not found.');
      }

      // 2. Generate Payment Number
      const count = await tx.customerPayment.count();
      const year = new Date().getFullYear();
      const paymentNumber = `PAY-${year}-${String(count + 1).padStart(4, '0')}`;

      // 3. Create payment record
      const payment = await tx.customerPayment.create({
        data: {
          paymentNumber,
          customerId: dto.customerId,
          saleId: dto.saleId,
          amount: dto.amount,
          paymentMethod: dto.paymentMethod,
          referenceNumber: dto.referenceNumber,
          notes: dto.notes,
          paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
          recordedById: dto.recordedById,
        },
      });

      // 4. If linked to a specific sale, update sale paid amount & status
      if (dto.saleId) {
        const sale = await tx.sale.findUnique({ where: { id: dto.saleId } });
        if (sale) {
          const newPaid = sale.paidAmount + dto.amount;
          const status = newPaid >= sale.totalAmount ? 'PAID' : 'PARTIALLY_PAID';
          await tx.sale.update({
            where: { id: dto.saleId },
            data: {
              paidAmount: newPaid,
              paymentStatus: status,
            },
          });
        }
      }

      return payment;
    });
  }

  static async getPayments(limit = 50) {
    return prisma.customerPayment.findMany({
      include: {
        customer: { select: { id: true, name: true, businessName: true, phone: true } },
        recordedBy: { select: { id: true, name: true } },
      },
      orderBy: { paymentDate: 'desc' },
      take: limit,
    });
  }

  static async deleteCustomerPayment(paymentId: string) {
    return await prisma.$transaction(async (tx) => {
      const payment = await tx.customerPayment.findUnique({
        where: { id: paymentId },
      });

      if (!payment) {
        throw new Error('Payment transaction not found');
      }

      // If linked to a sale, adjust sale's paid amount & status
      if (payment.saleId) {
        const sale = await tx.sale.findUnique({ where: { id: payment.saleId } });
        if (sale) {
          const newPaid = Math.max(0, sale.paidAmount - payment.amount);
          const status = newPaid <= 0 ? 'UNPAID' : newPaid >= sale.totalAmount ? 'PAID' : 'PARTIALLY_PAID';
          await tx.sale.update({
            where: { id: payment.saleId },
            data: {
              paidAmount: newPaid,
              paymentStatus: status,
            },
          });
        }
      }

      return await tx.customerPayment.delete({
        where: { id: paymentId },
      });
    });
  }
}
