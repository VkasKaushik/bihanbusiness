# BIHAN BUSINESS

> Private internal business-management application for the founders of **BIHAN HOME CARE** (Chhattisgarh, India).

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Prisma ORM with SQLite**.

---

## Features

- **Business Pulse (Home)**: High-level overview of daily sales, collections, expenses, customer pending balances, and stock alerts.
- **Semantic Daily Metrics**: At-a-glance color cards (Sales: Blue, Collected: Green, Expenses: Red/Orange, Customer Due: Amber).
- **Founder Expense & Settlements**: Transparent tracking of business-paid vs. founder-paid personal expenses and reimbursement balances (`/founder-expenses`).
- **Quick Record Floating Modal (+)**:
  - **Add Customer Progressive Wizard (5 steps)**: 30-second lead entry with optional direct first order and payment.
  - **New Sale / Order**: Instant stock deduction and automated customer ledger credit/cash settlement.
  - **Collect Payment**: Record customer collections against pending balances via UPI, Cash, or Bank.
  - **Add Expense**: Log business or personal expenses with category categorization.
- **Inventory & Production**: Stock movements and finished goods tracking.
- **IST Timezone Native**: All dates, metrics, and timestamps locked to Indian Standard Time (`Asia/Kolkata`).

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Lucide Icons
- **Database**: SQLite via Prisma ORM
- **Authentication**: JWT cookie-based session with bcrypt

---

## Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/VkasKaushik/bihanbusiness.git
cd bihanbusiness
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
```

### 3. Database Migration & Seed
```bash
npm run db:push
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

Default login credentials (seeded):
- **Username**: `vikas`
- **Password**: `bihan123`

---

## Production Build & Start

```bash
npm run build
npm start
```
