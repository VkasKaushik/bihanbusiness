import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding BIHAN BUSINESS database...');

  // 1. Seed Founders
  const vikasPasswordHash = await bcrypt.hash('Vikas123@', 10);
  const rupeshPasswordHash = await bcrypt.hash('Bihan123@', 10);

  const vikas = await prisma.user.upsert({
    where: { username: 'vikas' },
    update: {
      passwordHash: vikasPasswordHash,
    },
    create: {
      name: 'Vikas',
      username: 'vikas',
      passwordHash: vikasPasswordHash,
      role: 'FOUNDER',
      phone: '9827000001',
    },
  });

  const rupesh = await prisma.user.upsert({
    where: { username: 'rupesh' },
    update: {
      passwordHash: rupeshPasswordHash,
    },
    create: {
      name: 'Rupesh',
      username: 'rupesh',
      passwordHash: rupeshPasswordHash,
      role: 'FOUNDER',
      phone: '9827000002',
    },
  });

  console.log('Founders created:', vikas.name, rupesh.name);

  // 2. Seed Initial Products (Centralized Configuration)
  const initialProducts = [
    {
      sku: 'BIHAN-TC-5L',
      name: 'BIHAN Toilet Cleaner 5L',
      category: 'CLEANER',
      packSizeLitres: 5.0,
      mrp: 499.0,
      currentSellingPrice: 399.0,
      currentEstimatedCost: 180.0,
      minStockAlertLevel: 15,
      imageEmoji: '🚽',
      initialStock: 80,
    },
    {
      sku: 'BIHAN-FC-CLASSIC-5L',
      name: 'BIHAN Classic Floor Cleaner 5L',
      category: 'CLEANER',
      packSizeLitres: 5.0,
      mrp: 249.0,
      currentSellingPrice: 199.0,
      currentEstimatedCost: 95.0,
      minStockAlertLevel: 25,
      imageEmoji: '🧹',
      initialStock: 120,
    },
    {
      sku: 'BIHAN-FC-LAVENDER-5L',
      name: 'BIHAN Lavender Floor Cleaner 5L',
      category: 'CLEANER',
      packSizeLitres: 5.0,
      mrp: 299.0,
      currentSellingPrice: 249.0,
      currentEstimatedCost: 115.0,
      minStockAlertLevel: 20,
      imageEmoji: '🪻',
      initialStock: 100,
    },
  ];

  for (const prod of initialProducts) {
    const { initialStock, ...prodData } = prod;
    const existing = await prisma.product.findUnique({ where: { sku: prod.sku } });
    const product = await prisma.product.upsert({
      where: { sku: prod.sku },
      update: {
        mrp: prod.mrp,
        currentSellingPrice: prod.currentSellingPrice,
        currentEstimatedCost: prod.currentEstimatedCost,
      },
      create: prodData,
    });

    if (!existing) {
      // Record initial stock movement
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          quantityChange: initialStock,
          movementType: 'INITIAL_STOCK',
          notes: 'Initial inventory baseline',
        },
      });
      console.log(`Created product ${product.name} with ${initialStock} initial units.`);
    }
  }

  // 3. Seed Expense Categories
  const categories = [
    'Raw Material',
    'Packaging',
    'Marketing',
    'Travel & Petrol',
    'Software & Tech',
    'Printing & Labels',
    'Delivery & Freight',
    'Office & Refreshments',
    'Other',
  ];

  for (const name of categories) {
    await prisma.expenseCategory.upsert({
      where: { name },
      update: {},
      create: { name, isDefault: true },
    });
  }
  console.log('Expense categories seeded.');

  // 4. Seed Initial Customers
  const initialCustomers = [
    {
      name: 'Hotel Grand Raipur',
      businessName: 'Grand Hospitality Ltd',
      phone: '9827100001',
      city: 'Raipur',
      address: 'VIP Road, Raipur',
    },
    {
      name: 'Shri Krishna Restaurant',
      businessName: 'Krishna Pure Veg',
      phone: '9827100002',
      city: 'Bhilai',
      address: 'Sector 6 Market, Bhilai',
    },
    {
      name: 'Maheshwari Supermarket',
      businessName: 'Maheshwari Retails',
      phone: '9827100003',
      city: 'Durg',
      address: 'Station Road, Durg',
    },
  ];

  for (const cust of initialCustomers) {
    await prisma.customer.upsert({
      where: { phone: cust.phone },
      update: {},
      create: cust,
    });
  }
  console.log('Initial customers seeded.');

  console.log('BIHAN BUSINESS database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
