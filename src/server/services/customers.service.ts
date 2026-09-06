import { prisma } from '@/lib/db';
import { CalculationsService } from './calculations.service';
import { CustomerSummary } from '@/types';

export class CustomersService {
  static async getCustomerSummaries(): Promise<CustomerSummary[]> {
    const customers = await prisma.customer.findMany({
      where: { isActive: true },
      include: {
        sales: {
          where: { isArchived: false },
          orderBy: { date: 'desc' },
          take: 1,
          select: { date: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const balanceMap = await CalculationsService.getAllCustomerBalances();

    return customers.map((c) => {
      const balance = balanceMap.get(c.id) ?? {
        totalPurchased: 0,
        totalPaid: 0,
        outstanding: 0,
      };

      return {
        id: c.id,
        name: c.name,
        businessName: c.businessName,
        phone: c.phone,
        city: c.city,
        totalPurchased: balance.totalPurchased,
        totalPaid: balance.totalPaid,
        outstandingBalance: balance.outstanding,
        lastSaleDate: c.sales[0]?.date ? c.sales[0].date.toISOString() : null,
      };
    });
  }

  static async createCustomer(data: {
    name: string;
    businessName?: string;
    phone: string;
    city?: string;
    address?: string;
  }) {
    return prisma.customer.create({
      data: {
        name: data.name.trim(),
        businessName: data.businessName?.trim() || null,
        phone: data.phone.trim(),
        city: data.city?.trim() || 'Raipur',
        address: data.address?.trim() || null,
      },
    });
  }

  static async deleteCustomer(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: { sales: true, payments: true },
        },
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // If customer has no linked sales or payments, delete record completely
    if (customer._count.sales === 0 && customer._count.payments === 0) {
      return prisma.customer.delete({ where: { id } });
    }

    // Otherwise mark as inactive (archived) to preserve historical accounting records
    return prisma.customer.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
