import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clean the database
  await prisma.$transaction([
    prisma.paperTradingTransaction.deleteMany(),
    prisma.paperTradingAccount.deleteMany(),
    prisma.rebalanceRecommendation.deleteMany(),
    prisma.portfolioPlan.deleteMany(),
    prisma.taxLot.deleteMany(),
    prisma.taxSetting.deleteMany(),
    prisma.backtestTrade.deleteMany(),
    prisma.backtestSession.deleteMany(),
    prisma.automationPreference.deleteMany(),
    prisma.trade.deleteMany(),
    prisma.strategy.deleteMany(),
    prisma.tradingAccount.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // Create test users
  const testUser = await prisma.user.create({
    data: {
      username: 'testuser',
      email: 'test@example.com',
      password: await bcryptjs.hash('password123', 10),
      fullName: 'Test User',
      role: 'user',
      taxResidency: 'NZ',
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@stackmotive.com',
      password: await bcryptjs.hash('admin123', 10),
      fullName: 'Admin User',
      role: 'admin',
      taxResidency: 'NZ',
    },
  });

  // Create trading accounts
  const ibkrAccount = await prisma.tradingAccount.create({
    data: {
      userId: testUser.id,
      name: 'IBKR Main',
      broker: 'IBKR',
      accountNumber: 'U123456',
      isActive: true,
      balance: 100000,
      currency: 'USD',
    },
  });

  const kucoinAccount = await prisma.tradingAccount.create({
    data: {
      userId: testUser.id,
      name: 'KuCoin Trading',
      broker: 'KuCoin',
      isActive: true,
      balance: 50000,
      currency: 'USDT',
    },
  });

  // Create strategies
  const dcaStrategy = await prisma.strategy.create({
    data: {
      userId: testUser.id,
      accountId: ibkrAccount.id,
      name: 'DCA Strategy',
      description: 'Dollar Cost Averaging into S&P 500',
      symbol: 'SPY',
      exchange: 'NYSE',
      indicators: JSON.stringify({
        type: 'DCA',
        interval: 'MONTHLY',
        amount: 1000,
      }),
      entryConditions: JSON.stringify({
        schedule: 'FIRST_MONDAY',
        maxPrice: null,
      }),
      exitConditions: JSON.stringify({
        type: 'MANUAL',
      }),
      riskPercentage: 1,
      status: 'active',
    },
  });

  const barbellStrategy = await prisma.strategy.create({
    data: {
      userId: testUser.id,
      accountId: ibkrAccount.id,
      name: 'Barbell Strategy',
      description: 'Barbell strategy with TLT and TQQQ',
      symbol: 'MULTI',
      exchange: 'NYSE',
      indicators: JSON.stringify({
        type: 'BARBELL',
        safeAllocation: 80,
        riskyAllocation: 20,
        safeAsset: 'TLT',
        riskyAsset: 'TQQQ',
      }),
      entryConditions: JSON.stringify({
        rebalanceThreshold: 5,
      }),
      exitConditions: JSON.stringify({
        type: 'THRESHOLD',
        maxDrawdown: 15,
      }),
      riskPercentage: 2,
      status: 'active',
    },
  });

  // Create some trades
  await prisma.trade.create({
    data: {
      userId: testUser.id,
      strategyId: dcaStrategy.id,
      accountId: ibkrAccount.id,
      symbol: 'SPY',
      type: 'buy',
      entryPrice: 475.50,
      amount: 1000,
      status: 'closed',
      profitLoss: 25.50,
      profitLossPercentage: 2.55,
      exchange: 'NYSE',
      entryTime: new Date('2024-01-15'),
      exitTime: new Date('2024-02-15'),
      exitPrice: 488.75,
      isAutomated: true,
    },
  });

  // Create paper trading account
  const paperAccount = await prisma.paperTradingAccount.create({
    data: {
      userId: testUser.id,
      name: 'Paper Trading',
      initialBalance: 100000,
      currentBalance: 102500,
      currency: 'USD',
      isActive: true,
    },
  });

  // Create tax settings
  await prisma.taxSetting.create({
    data: {
      userId: testUser.id,
      country: 'NZ',
      taxYear: '2024',
      accountingMethod: 'FIFO',
      includeFees: true,
      includeForeignTax: true,
      capitalGainsRules: JSON.stringify({
        shortTerm: 33,
        longTerm: 33,
        threshold: 365,
      }),
      ratesTable: JSON.stringify({
        '2024': 0.33,
      }),
      exemptions: JSON.stringify([]),
    },
  });

  // Create demo user
  const hashedPassword = await bcryptjs.hash('password123', 10);
  
  const demoUser = await prisma.user.create({
    data: {
      username: 'demo',
      email: 'demo@stackmotive.com',
      password: hashedPassword,
      role: 'user',
      onboardingComplete: true,
      onboardingStep: 4,
      taxResidency: 'NZ',
      taxSettings: {
        create: {
          country: 'NZ',
          taxYear: '2024',
          accountingMethod: 'FIFO',
          includeFees: true,
          includeForeignTax: true,
          offsetLosses: true,
          carryForward: true
        }
      }
    }
  });

  console.log('✅ Seed data created successfully');
  console.log('Demo user created:', demoUser);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

