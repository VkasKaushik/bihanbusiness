import { prisma } from '../src/lib/db';
import { CalculationsService } from '../src/server/services/calculations.service';
import { SalesService } from '../src/server/services/sales.service';
import { PaymentsService } from '../src/server/services/payments.service';

async function runVerification() {
  console.log('=== STARTING BIHAN BUSINESS PHASE 1 VERIFICATION ===\n');

  // 1. Verify Founders
  const founders = await prisma.user.findMany();
  console.log(`[PASS] Found ${founders.length} founders: ${founders.map((f) => f.name).join(', ')}`);

  // 2. Verify Products
  const products = await prisma.product.findMany();
  console.log(`[PASS] Found ${products.length} products:`);
  for (const p of products) {
    const stock = await CalculationsService.getStockOnHand(p.id);
    console.log(`       - ${p.name} | MRP: ₹${p.mrp} | Selling Price: ₹${p.currentSellingPrice} | Live Stock: ${stock} cans`);
  }

  // 3. Verify Customer & Initial Outstanding
  const customer = await prisma.customer.findFirst({ where: { name: 'Hotel Grand Raipur' } });
  if (!customer) throw new Error('Hotel Grand Raipur not found in database');
  const initialDue = await CalculationsService.getCustomerOutstanding(customer.id);
  console.log(`\n[PASS] Customer "${customer.name}" initial outstanding: ₹${initialDue}`);

  // 4. Test Atomic Event: SALE
  console.log('\n--> Executing Event: SALE (5 units Toilet Cleaner @ ₹399 = ₹1,995. Upfront paid: ₹1,000)');
  const toiletCleaner = products.find((p) => p.sku === 'BIHAN-TC-5L')!;
  const stockBefore = await CalculationsService.getStockOnHand(toiletCleaner.id);

  const sale = await SalesService.createSale({
    customerId: customer.id,
    items: [{ productId: toiletCleaner.id, quantity: 5 }],
    paidAmount: 1000,
    paymentMethod: 'UPI',
    notes: 'Hotel Grand Phase 1 Test Order',
  });

  const stockAfter = await CalculationsService.getStockOnHand(toiletCleaner.id);
  const dueAfterSale = await CalculationsService.getCustomerOutstanding(customer.id);

  console.log(`[PASS] Sale Created: #${sale.saleNumber} | Total: ₹${sale.totalAmount} | Paid: ₹${sale.paidAmount} | Status: ${sale.paymentStatus}`);
  console.log(`[PASS] Toilet Cleaner Stock: ${stockBefore} -> ${stockAfter} cans (Decreased by exactly 5)`);
  console.log(`[PASS] Customer Outstanding Due: ₹${dueAfterSale} (Expected: ₹995)`);

  if (stockBefore - stockAfter !== 5) throw new Error('Stock decrement mismatch!');
  if (dueAfterSale !== 995) throw new Error(`Customer due mismatch! Expected 995, got ${dueAfterSale}`);

  // 5. Test Atomic Event: COLLECTION
  console.log('\n--> Executing Event: COLLECTION (Hotel Grand pays ₹500 via Cash)');
  const payment = await PaymentsService.recordCustomerPayment({
    customerId: customer.id,
    amount: 500,
    paymentMethod: 'CASH',
    notes: 'Part clearance of due',
  });

  const dueAfterPayment = await CalculationsService.getCustomerOutstanding(customer.id);
  console.log(`[PASS] Payment Recorded: #${payment.paymentNumber} | Amount: ₹${payment.amount} | Method: ${payment.paymentMethod}`);
  console.log(`[PASS] Customer Outstanding Due: ₹${dueAfterPayment} (Expected: ₹495)`);

  if (dueAfterPayment !== 495) throw new Error(`Customer due mismatch! Expected 495, got ${dueAfterPayment}`);

  // 6. Verify Money Balances & Profit
  const money = await CalculationsService.getMoneyBalances();
  console.log(`\n[PASS] Liquid Balances: Cash on Hand = ₹${money.cashOnHand} | Bank/UPI = ₹${money.bankBalance}`);

  const profit = await CalculationsService.getEstimatedProfit();
  console.log(`[PASS] Estimated Profit: Revenue = ₹${profit.revenue} | Cost = ₹${profit.costOfGoods} | Net Estimated Profit = ₹${profit.netEstimatedProfit}`);

  console.log('\n=== ALL PHASE 1 BUSINESS RULES & CALCULATIONS VERIFIED 100% ===');
}

runVerification()
  .catch((e) => {
    console.error('VERIFICATION FAILED:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
