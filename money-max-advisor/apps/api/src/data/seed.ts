import type {
  Account,
  Budget,
  Bill,
  IncomeStream,
  AdvisorSettings,
} from '@money-max/shared';

// ── Accounts ──────────────────────────────────────────────────────────────────
// Realistic US household: BOA checking near-zero, CC buffer, 3 paycheck
// destinations, mortgage + car loan.

export const seedAccounts: Account[] = [
  {
    id: 'acc-boa-checking',
    name: 'BOA Checking',
    type: 'checking',
    balance: 42.17,           // essentially empty — Money Max pattern
    interestRateAPR: 0,
    institution: 'Bank of America',
  },
  {
    id: 'acc-boa-savings',
    name: 'BOA Savings',
    type: 'savings',
    balance: 1_820.50,
    interestRateAPR: 0.01,    // 0.01% APY — basically nothing
    institution: 'Bank of America',
  },
  {
    id: 'acc-ally-savings',
    name: 'Ally HYSA',
    type: 'savings',
    balance: 6_450.00,
    interestRateAPR: 4.75,
    institution: 'Ally Bank',
  },
  {
    id: 'acc-boa-cc',
    name: 'BOA Cash Rewards Visa',
    type: 'credit',
    balance: -4_832.19,       // owed; stored as negative
    interestRateAPR: 24.99,
    institution: 'Bank of America',
    creditLimit: 12_000,
    minimumPayment: 97,
    dueDay: 15,
  },
  {
    id: 'acc-chase-cc',
    name: 'Chase Sapphire Preferred',
    type: 'credit',
    balance: -1_201.44,
    interestRateAPR: 21.74,
    institution: 'Chase',
    creditLimit: 8_000,
    minimumPayment: 25,
    dueDay: 22,
  },
  {
    id: 'acc-mortgage',
    name: 'BOA 30yr Mortgage',
    type: 'mortgage',
    balance: -287_450.00,
    interestRateAPR: 6.875,
    institution: 'Bank of America',
    minimumPayment: 1_892,
    dueDay: 1,
  },
  {
    id: 'acc-car-loan',
    name: 'Toyota Car Loan',
    type: 'loan',
    balance: -14_320.00,
    interestRateAPR: 5.99,
    institution: 'Toyota Financial',
    minimumPayment: 387,
    dueDay: 10,
  },
  {
    id: 'acc-401k',
    name: '401(k) – Fidelity',
    type: 'investment',
    balance: 48_200.00,
    interestRateAPR: 0,       // market-based; not modeled as interest
    institution: 'Fidelity',
  },
];

// ── Income Streams ────────────────────────────────────────────────────────────
// Primary earner: bi-weekly paycheck split across 3 accounts.
// Secondary: freelance once a month into Ally HYSA.

export const seedIncomeStreams: IncomeStream[] = [
  {
    id: 'inc-primary',
    name: 'Acme Corp Salary',
    grossAmount: 4_615.38,   // $120k/yr ÷ 26
    netAmount: 3_350.00,
    frequency: 'bi-weekly',
    nextPayDate: nextBiweeklyPayday().toISOString().split('T')[0],
    destinationAccountIds: [
      { accountId: 'acc-boa-checking', amount: 1_500.00 },
      { accountId: 'acc-ally-savings', amount: 1_500.00 },
      { accountId: 'acc-401k', amount: 350.00 },  // 401k contribution
    ],
  },
  {
    id: 'inc-freelance',
    name: 'Freelance / Side Income',
    grossAmount: 1_000.00,
    netAmount: 850.00,
    frequency: 'monthly',
    nextPayDate: firstOfNextMonth().toISOString().split('T')[0],
    destinationAccountIds: [
      { accountId: 'acc-ally-savings', amount: 850.00 },
    ],
  },
];

// ── Budgets ───────────────────────────────────────────────────────────────────

export const seedBudgets: Budget[] = [
  { id: 'bgt-housing',     name: 'Housing',        category: 'housing',        allocatedMonthly: 2_200, spentThisMonth: 1_892 },
  { id: 'bgt-transport',   name: 'Transportation', category: 'transportation', allocatedMonthly: 600,   spentThisMonth: 423 },
  { id: 'bgt-food',        name: 'Groceries',      category: 'food',           allocatedMonthly: 700,   spentThisMonth: 548 },
  { id: 'bgt-utilities',   name: 'Utilities',      category: 'utilities',      allocatedMonthly: 250,   spentThisMonth: 217 },
  { id: 'bgt-health',      name: 'Healthcare',     category: 'healthcare',     allocatedMonthly: 200,   spentThisMonth: 75 },
  { id: 'bgt-personal',    name: 'Personal',       category: 'personal',       allocatedMonthly: 300,   spentThisMonth: 189 },
  { id: 'bgt-entertain',   name: 'Entertainment',  category: 'entertainment',  allocatedMonthly: 150,   spentThisMonth: 62 },
  { id: 'bgt-savings',     name: 'Savings Goals',  category: 'savings',        allocatedMonthly: 500,   spentThisMonth: 0 },
];

// ── Bills ─────────────────────────────────────────────────────────────────────

export const seedBills: Bill[] = [
  {
    id: 'bill-mortgage',   name: 'Mortgage',          amount: 1_892, frequency: 'monthly', dueDay: 1,  accountId: 'acc-boa-checking', category: 'housing',        autopay: true },
  {
    id: 'bill-car-loan',   name: 'Car Loan',           amount: 387,   frequency: 'monthly', dueDay: 10, accountId: 'acc-boa-checking', category: 'transportation', autopay: true },
  {
    id: 'bill-boa-cc',     name: 'BOA CC Min Payment', amount: 97,    frequency: 'monthly', dueDay: 15, accountId: 'acc-boa-checking', category: 'debt',           autopay: false },
  {
    id: 'bill-chase-cc',   name: 'Chase CC Min Pay',   amount: 25,    frequency: 'monthly', dueDay: 22, accountId: 'acc-boa-checking', category: 'debt',           autopay: false },
  {
    id: 'bill-electric',   name: 'Electric',           amount: 130,   frequency: 'monthly', dueDay: 8,  accountId: 'acc-boa-checking', category: 'utilities',      autopay: true },
  {
    id: 'bill-internet',   name: 'Internet',           amount: 65,    frequency: 'monthly', dueDay: 12, accountId: 'acc-boa-checking', category: 'utilities',      autopay: true },
  {
    id: 'bill-phone',      name: 'Cell Phone',         amount: 85,    frequency: 'monthly', dueDay: 20, accountId: 'acc-boa-checking', category: 'utilities',      autopay: true },
  {
    id: 'bill-streaming',  name: 'Streaming Services', amount: 45,    frequency: 'monthly', dueDay: 5,  accountId: 'acc-chase-cc',     category: 'entertainment',  autopay: true },
  {
    id: 'bill-gym',        name: 'Gym Membership',     amount: 35,    frequency: 'monthly', dueDay: 1,  accountId: 'acc-chase-cc',     category: 'personal',       autopay: true },
];

// ── Default Settings ──────────────────────────────────────────────────────────

export const seedSettings: AdvisorSettings = {
  methodMode: 'checking_savings',
  paycheckSplitHints: [
    { accountId: 'acc-boa-checking', percentOrFixed: 'fixed', value: 1_500 },
    { accountId: 'acc-ally-savings', percentOrFixed: 'fixed', value: 1_500 },
    { accountId: 'acc-401k',         percentOrFixed: 'fixed', value: 350 },
  ],
  currency: 'USD',
  timezone: 'America/New_York',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function nextBiweeklyPayday(): Date {
  const d = new Date();
  const dayOfWeek = d.getDay();
  // Assume payday is Friday; find next Friday
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilFriday);
  return d;
}

function firstOfNextMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 1);
}
