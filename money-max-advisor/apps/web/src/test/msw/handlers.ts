import { http, HttpResponse } from 'msw'
import type {
  Account,
  ActionItem,
  Budget,
  Bill,
  CashflowPoint,
  DashboardSummary,
  IncomeItem,
  ReportSummary,
} from '../../api/client'

const BASE = ''

export const mockDashboard: DashboardSummary & {
  yearsToPayOff?: number
  interestRemaining?: number
  principalPaid?: number
  principalRemaining?: number
  nextDebtTransfer?: { date: string; amount: number; actionId: string } | null
} = {
  debtFreeDate: '2029-12-01',
  totalDebt: 300000,
  interestSavedProjected: 199,
  interestSavedActual: 0,
  discretionaryIncome: 3208,
  emergencyFund: 6500,
  netWorth: -250000,
  monthlyIncome: 8000,
  monthlyExpenses: 4792,
  yearsToPayOff: 3.4,
  interestRemaining: 840,
  principalPaid: 24000,
  principalRemaining: 300000,
  nextDebtTransfer: { date: '2026-08-06', amount: 4832, actionId: 'act1' },
}

export const mockAccounts: Account[] = [
  {
    id: 'a1',
    name: 'BOA Checking',
    institution: 'Bank of America',
    type: 'checking',
    balance: 42,
    interestRateAPR: 0,
  },
  {
    id: 'a2',
    name: 'BOA Credit Card',
    institution: 'Bank of America',
    type: 'credit',
    balance: -4800,
    interestRateAPR: 24.99,
  },
  {
    id: 'a3',
    name: 'Student Loan',
    institution: 'Navient',
    type: 'loan',
    balance: -28000,
    interestRateAPR: 6.8,
  },
  {
    id: 'a4',
    name: 'CU Home Equity LOC',
    institution: 'Local Credit Union',
    type: 'heloc',
    balance: -22500,
    interestRateAPR: 8.49,
    minimumPayment: 159,
    interestOnlyPeriod: {
      active: true,
      months: 24,
      endDate: '2027-09-01',
    },
  },
]

export const mockActions: ActionItem[] = [
  {
    id: 'act1',
    type: 'debt_payment',
    fromAccountId: 'a1',
    toAccountId: 'a2',
    amount: 800,
    suggestedDate: '2026-08-15',
    reason: 'Extra payment to highest APR card',
    interestImpact: 210,
    status: 'pending',
    priority: 1,
  },
  {
    id: 'act2',
    type: 'transfer',
    fromAccountId: 'a1',
    toAccountId: 'a3',
    amount: 200,
    suggestedDate: '2026-08-20',
    reason: 'Additional student loan payment',
    interestImpact: 45,
    status: 'pending',
    priority: 2,
  },
]

export const mockBudgets: Budget[] = [
  {
    id: 'b1',
    name: 'Groceries',
    category: 'Food & Dining',
    allocatedMonthly: 600,
    spentThisMonth: 420,
  },
  {
    id: 'b2',
    name: 'Electric',
    category: 'Bills & Utilities',
    allocatedMonthly: 150,
    spentThisMonth: 140,
  },
  {
    id: 'b3',
    name: 'Dining Out',
    category: 'Food & Dining',
    allocatedMonthly: 200,
    spentThisMonth: 240,
  },
]

export const mockBills: Bill[] = [
  {
    id: 'bill1',
    name: 'Electric',
    amount: 140,
    frequency: 'monthly',
    dueDay: 12,
    accountId: 'a1',
    category: 'utilities',
    autopay: true,
  },
  {
    id: 'bill2',
    name: 'Internet',
    amount: 80,
    frequency: 'monthly',
    dueDay: 15,
    accountId: 'a1',
    category: 'utilities',
    autopay: false,
  },
]

export const mockIncomes: IncomeItem[] = [
  {
    id: 'inc1',
    name: 'Primary Paycheck',
    frequency: 'biweekly',
    expectedMonthly: 5200,
    receivedThisMonth: 5200,
  },
  {
    id: 'inc2',
    name: 'Freelance',
    frequency: 'monthly',
    expectedMonthly: 1500,
    receivedThisMonth: 800,
  },
  {
    id: 'inc3',
    name: 'Rental Income',
    frequency: 'monthly',
    expectedMonthly: 1300,
    receivedThisMonth: 1300,
  },
]

export const mockCashflow: CashflowPoint[] = [
  { date: '2026-08-01', inflow: 3700, outflow: 1200, balance: 2500 },
  { date: '2026-08-02', inflow: 0, outflow: 80, balance: 2420 },
  { date: '2026-08-05', inflow: 2600, outflow: 350, balance: 4670 },
  { date: '2026-08-08', inflow: 0, outflow: 200, balance: 4470 },
]

export const mockReport: ReportSummary = {
  period: '12m',
  totalInterestPaid: 12000,
  totalPrincipalPaid: 24000,
  savingsRate: 18,
  debtPayoffProgress: 12,
  wealthTrajectory: [
    { date: '2026-01-01', assets: 50000, liabilities: 320000, netWorth: -270000 },
    { date: '2026-04-01', assets: 52000, liabilities: 310000, netWorth: -258000 },
    { date: '2026-08-01', assets: 55000, liabilities: 300000, netWorth: -245000 },
  ],
}

export const handlers = [
  http.get(`${BASE}/api/dashboard`, () => HttpResponse.json(mockDashboard)),
  http.get(`${BASE}/api/accounts`, () => HttpResponse.json({ accounts: mockAccounts })),
  http.post(`${BASE}/api/accounts`, async ({ request }) => {
    const body = (await request.json()) as {
      name: string
      kind?: string
      balance: number
      interestOnlyPeriod?: { active: boolean }
    }
    return HttpResponse.json(
      {
        account: {
          id: 'a-new',
          name: body.name,
          type: body.kind === 'mortgage' ? 'mortgage' : 'loan',
          balance: -Math.abs(body.balance),
          interestRateAPR: 0,
          institution: '',
          interestOnlyPeriod: body.interestOnlyPeriod,
        },
      },
      { status: 201 },
    )
  }),
  http.get(`${BASE}/api/actions`, () => HttpResponse.json({ actions: mockActions })),
  http.get(`${BASE}/api/budgets`, () =>
    HttpResponse.json({ budgets: mockBudgets, bills: mockBills, incomes: mockIncomes }),
  ),
  http.get(`${BASE}/api/cashflow`, () =>
    HttpResponse.json({ range: '90d', points: mockCashflow }),
  ),
  http.get(`${BASE}/api/reports/wealth`, () => HttpResponse.json(mockReport)),
  http.post(`${BASE}/api/actions/:id/approve`, ({ params }) => {
    const action = mockActions.find((a) => a.id === params['id'])
    return HttpResponse.json(action ? { ...action, status: 'approved' } : { status: 'approved' })
  }),
  http.post(`${BASE}/api/actions/:id/execute`, ({ params }) => {
    const action = mockActions.find((a) => a.id === params['id'])
    return HttpResponse.json(action ? { ...action, status: 'executed' } : { status: 'executed' })
  }),
  http.post(`${BASE}/api/actions/:id/dismiss`, ({ params }) => {
    const action = mockActions.find((a) => a.id === params['id'])
    return HttpResponse.json(action ? { ...action, status: 'dismissed' } : { status: 'dismissed' })
  }),
  http.post(`${BASE}/api/advisor/chat`, () =>
    HttpResponse.json({ reply: 'Demo advisor reply' }),
  ),
]
