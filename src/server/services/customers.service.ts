import { prisma } from '@/lib/db';
import { CalculationsService } from './calculations.service';
import { CustomerSummary, CustomerDetail, CustomerNote } from '@/types';

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

  static async getCustomerById(id: string): Promise<CustomerDetail | null> {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        sales: {
          where: { isArchived: false },
          include: {
            items: {
              include: {
                product: {
                  select: { id: true, name: true, sku: true, packSizeLitres: true, imageEmoji: true },
                },
              },
            },
            createdBy: {
              select: { id: true, name: true },
            },
          },
          orderBy: { date: 'desc' },
        },
        payments: {
          include: {
            recordedBy: {
              select: { id: true, name: true },
            },
          },
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!customer) return null;

    const totalPurchased = customer.sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalPaid = customer.payments.reduce((sum, p) => sum + p.amount, 0);
    const totalDue = Math.max(0, totalPurchased - totalPaid);

    let parsedNotes: CustomerNote[] = [];
    if (customer.notes) {
      try {
        const json = JSON.parse(customer.notes);
        if (Array.isArray(json)) {
          parsedNotes = json;
        } else if (typeof json === 'string') {
          parsedNotes = [{ id: 'legacy-1', text: json, createdAt: customer.createdAt.toISOString() }];
        }
      } catch {
        parsedNotes = [{ id: 'legacy-1', text: customer.notes, createdAt: customer.createdAt.toISOString() }];
      }
    }

    return {
      id: customer.id,
      name: customer.name,
      businessName: customer.businessName,
      phone: customer.phone,
      city: customer.city,
      address: customer.address,
      creditLimit: customer.creditLimit,
      notes: parsedNotes,
      rawNotes: customer.notes,
      isActive: customer.isActive,
      createdAt: customer.createdAt.toISOString(),
      financialSummary: {
        totalPurchased,
        totalPaid,
        totalDue,
      },
      sales: customer.sales.map((s) => ({
        id: s.id,
        saleNumber: s.saleNumber,
        date: s.date.toISOString(),
        subtotalAmount: s.subtotalAmount,
        discountAmount: s.discountAmount,
        totalAmount: s.totalAmount,
        paymentStatus: s.paymentStatus,
        paidAmount: s.paidAmount,
        notes: s.notes,
        items: s.items.map((i) => ({
          id: i.id,
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          lineTotal: i.lineTotal,
          product: i.product,
        })),
        createdBy: s.createdBy,
      })),
      payments: customer.payments.map((p) => ({
        id: p.id,
        paymentNumber: p.paymentNumber,
        amount: p.amount,
        paymentDate: p.paymentDate.toISOString(),
        paymentMethod: p.paymentMethod,
        referenceNumber: p.referenceNumber,
        notes: p.notes,
        recordedBy: p.recordedBy,
      })),
    };
  }

  static async addCustomerNote(id: string, text: string, authorName?: string): Promise<CustomerNote[]> {
    const customer = await prisma.customer.findUnique({
      where: { id },
      select: { notes: true, createdAt: true },
    });
    if (!customer) {
      throw new Error('Customer not found');
    }

    let currentNotes: CustomerNote[] = [];
    if (customer.notes) {
      try {
        const json = JSON.parse(customer.notes);
        if (Array.isArray(json)) {
          currentNotes = json;
        } else if (typeof json === 'string') {
          currentNotes = [{ id: 'legacy-1', text: json, createdAt: customer.createdAt.toISOString() }];
        }
      } catch {
        currentNotes = [{ id: 'legacy-1', text: customer.notes, createdAt: customer.createdAt.toISOString() }];
      }
    }

    const newNote: CustomerNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      authorName: authorName || undefined,
    };

    const updatedNotes = [newNote, ...currentNotes];

    await prisma.customer.update({
      where: { id },
      data: {
        notes: JSON.stringify(updatedNotes),
      },
    });

    return updatedNotes;
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
