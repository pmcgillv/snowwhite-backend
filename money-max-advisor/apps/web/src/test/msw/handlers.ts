import { http, HttpResponse } from 'msw'
import type {
  Account,
  ActionItem,
  Budget,
  Bill,
  CashflowPoint,
  DashboardSummary,
  ReportSummary,
} from '../../api/client'

const BASE = ''

export const mockDashboard: DashboardSummary = {
  debtFreeDate: '2027-06-01',
  totalDebt: 300000,
  interestSavedProjected: 8420,
  discretionaryIncome: 1240,
  emergencyFund: 6500,
  netWorth: -250000,
  monthlyIncome: 8000,
  monthlyExpenses: 4900,
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
]

export const mockBudgets: Budget[] = [
  {
    id: 'b1',
    name: 'Groceries',
    category: 'food',
    allocatedMonthly: 600,
    spentThisMonth: 420,
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
]

export const mockCashflow: CashflowPoint[] = [
  { date: '2026-08-01', inflow: 3700, outflow: 1200, balance: 2500 },
  { date: '2026-08-02', inflow: 0, outflow: 80, balance: 2420 },
]

export const mockReport: ReportSummary = {
  period: '12m',
  totalInterestPaid: 12000,
  totalPrincipalPaid: 24000,
  savingsRate: 18,
  debtPayoffProgress: 12,
  wealthTrajectory: [
    { date: '2026-01-01', assets: 50000, liabilities: 320000, netWorth: -270000 },
    { date: '2026-08-01', assets: 55000, liabilities: 300000, netWorth: -245000 },
  ],
}

export const handlers = [
  http.get(`${BASE}/api/dashboard`, () => HttpResponse.json(mockDashboard)),
  http.get(`${BASE}/api/accounts`, () => HttpResponse.json({ accounts: mockAccounts })),
  http.get(`${BASE}/api/actions`, () => HttpResponse.json({ actions: mockActions })),
  http.get(`${BASE}/api/budgets`, () =>
    HttpResponse.json({ budgets: mockBudgets, bills: mockBills }),
  ),
  http.get(`${BASE}/api/cashflow`, () =>
    HttpResponse.json({ range: '90d', points: mockCashflow }),
  ),
  http.get(`${BASE}/api/reports/wealth`, () => HttpResponse.json(mockReport)),
  http.post(`${BASE}/api/actions/:id/approve`, () =>
    HttpResponse.json({ ...mockActions[0], status: 'approved' }),
  ),
  http.post(`${BASE}/api/advisor/chat`, () =>
    HttpResponse.json({ reply: 'Demo advisor reply' }),
  ),
]
