export type Role = 'FOUNDER' | 'STAFF';

export type PaymentMethodType = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE';

export type PaymentSourceType = 'BUSINESS_CASH' | 'BUSINESS_BANK' | 'FOUNDER_PERSONAL';

export interface CurrentUser {
  id: string;
  name: string;
  username: string;
  role: Role;
}

export interface DashboardSummary {
  // Dynamic current date in IST
  todayDateDisplay: string;

  // TODAY
  todaySalesAmount: number;
  todaySalesCount: number;
  todayCollectionsAmount: number;
  todayCollectionsCount: number;
  todayExpensesAmount: number;
  todayExpensesCount: number;
  totalCustomerDue: number;
  totalCustomersWithDue: number;

  // THIS MONTH
  monthSalesAmount: number;
  monthOrdersCount: number;
  monthEstimatedProfit: number;

  // ATTENTION
  lowStockCount: number;
  lowStockItems: Array<{
    id: string;
    name: string;
    sku: string;
    currentStock: number;
    minAlertLevel: number;
    imageEmoji: string;
  }>;
  pendingCustomerPayments: Array<{
    customerId: string;
    name: string;
    businessName: string | null;
    phone: string;
    outstandingBalance: number;
  }>;
  supplierDueAmount: number;
  supplierDueCount: number;

  // LIQUID BALANCES
  cashOnHand: number;
  bankBalance: number;
  upiBalance: number;
  totalAvailableMoney: number;

  // RECENT TRANSACTIONS
  recentSales: Array<{
    id: string;
    saleNumber: string;
    customerId?: string;
    customerName: string;
    totalAmount: number;
    paidAmount: number;
    paymentStatus: string;
    createdAt: string;
  }>;

  // FOUNDER EXPENSE SPLIT
  founderExpenseSplit: {
    businessPaid: number;
    founderPaid: number;
    settlementMessage: string;
    details: Array<{
      founderName: string;
      paidPersonally: number;
    }>;
  };
}

export interface MoneyOverview {
  availableMoney: {
    cash: number;
    bank: number;
    upi: number;
    other: number;
    total: number;
  };
  customerMoney: {
    totalCustomerDue: number;
    debtorsCount: number;
    topDebtors: Array<{
      id: string;
      name: string;
      businessName: string | null;
      phone: string;
      outstandingBalance: number;
    }>;
  };
  supplierMoney: {
    totalSupplierDue: number;
    suppliersCount: number;
  };
  founderMoney: {
    businessOwesFounders: number;
    settlementMessage: string;
    details: Array<{
      founderName: string;
      paidPersonally: number;
    }>;
  };
  todayMetrics: {
    collections: number;
    expenses: number;
  };
  recentTransactions: Array<{
    id: string;
    type: 'COLLECTION' | 'EXPENSE' | 'SETTLEMENT';
    title: string;
    subtitle: string;
    amount: number;
    method: string;
    date: string;
  }>;
}

export interface ProductStockSummary {
  id: string;
  sku: string;
  name: string;
  category: string;
  packSizeLitres: number;
  mrp: number;
  currentSellingPrice: number;
  currentEstimatedCost: number;
  currentStock: number;
  minStockAlertLevel: number;
  imageEmoji: string;
  isLowStock: boolean;
}

export interface CustomerSummary {
  id: string;
  name: string;
  businessName: string | null;
  phone: string;
  city: string;
  totalPurchased: number;
  totalPaid: number;
  outstandingBalance: number;
  lastSaleDate: string | null;
}

export interface CustomerNote {
  id: string;
  text: string;
  createdAt: string;
  authorName?: string;
}

export interface CustomerDetailSaleItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  product: {
    id: string;
    name: string;
    sku: string;
    imageEmoji: string;
  };
}

export interface CustomerDetailSale {
  id: string;
  saleNumber: string;
  date: string;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentStatus: string;
  paidAmount: number;
  notes?: string | null;
  items: CustomerDetailSaleItem[];
  createdBy?: {
    id: string;
    name: string;
  } | null;
}

export interface CustomerDetailPayment {
  id: string;
  paymentNumber: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber?: string | null;
  notes?: string | null;
  recordedBy?: {
    id: string;
    name: string;
  } | null;
}

export interface CustomerDetail {
  id: string;
  name: string;
  businessName: string | null;
  phone: string;
  city: string;
  address: string | null;
  creditLimit: number;
  notes: CustomerNote[];
  rawNotes?: string | null;
  isActive: boolean;
  createdAt: string;
  financialSummary: {
    totalPurchased: number;
    totalPaid: number;
    totalDue: number;
  };
  sales: CustomerDetailSale[];
  payments: CustomerDetailPayment[];
}
