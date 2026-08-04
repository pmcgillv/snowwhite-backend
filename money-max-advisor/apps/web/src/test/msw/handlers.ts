import { http, HttpResponse } from 'msw'
import type {
  DashboardSummary,
  Account,
  Budget,
  Action,
  CashflowEntry,
  WealthReport,
} from '../../api/client'

const BASE = ''

export const mockDashboard: DashboardSummary = {
  debtFreeDate: '2027-06-01',
  interestSaved: 8420,
  discretionaryIncome: 1240,
  emergencyFundMonths: 3.5,
  nextActions: [
    {
      id: 'a1',
      title: 'Extra payment to Chase Sapphire',
      description: 'Apply $800 extra to your highest-rate card this cycle to save $210 in interest.',
      amount: 800,
      priority: 'high',
      type: 'payment',
      status: 'pending',
      dueDate: '2026-08-15',
    },
    {
      id: 'a2',
      title: 'Rebalance emergency fund',
      description: 'Move $400 from savings to 3-month emergency reserve.',
      amount: 400,
      priority: 'medium',
      type: 'transfer',
      status: 'pending',
    },
    {
      id: 'a3',
      title: 'Review grocery budget',
      description: 'You exceeded your grocery budget by 18% last month. Consider revising.',
      amount: 0,
      priority: 'low',
      type: 'review',
      status: 'pending',
    },
  ],
}

export const mockAccounts: Account[] = [
  {
    id: 'acc-1',
    name: 'Primary Checking',
    institution: 'Chase',
    type: 'checking',
    balance: 4200,
    connected: true,
  },
  {
    id: 'acc-2',
    name: 'High-Yield Savings',
    institution: 'Ally Bank',
    type: 'savings',
    balance: 8600,
    connected: true,
  },
  {
    id: 'acc-3',
    name: 'Sapphire Preferred',
    institution: 'Chase',
    type: 'credit_card',
    balance: -6400,
    limit: 15000,
    interestRate: 22.74,
    connected: true,
  },
  {
    id: 'acc-4',
    name: 'Student Loan',
    institution: 'Navient',
    type: 'loan',
    balance: -18200,
    interestRate: 5.8,
    connected: false,
  },
]

export const mockBudgets: Budget[] = [
  { id: 'b-inc-1', name: 'Primary Salary', category: 'income', allocated: 5800, spent: 5800, type: 'income' },
  { id: 'b-inc-2', name: 'Freelance',      category: 'income', allocated: 600,  spent: 300,  type: 'income' },
  { id: 'b-1',  name: 'Rent',       category: 'housing',  allocated: 1800, spent: 1800, type: 'expense' },
  { id: 'b-2',  name: 'Groceries',  category: 'food',     allocated: 400,  spent: 472,  type: 'expense' },
  { id: 'b-3',  name: 'Transport',  category: 'transport',allocated: 200,  spent: 155,  type: 'expense' },
  { id: 'b-4',  name: 'Utilities',  category: 'home',     allocated: 180,  spent: 162,  type: 'expense' },
  { id: 'b-5',  name: 'Dining Out', category: 'food',     allocated: 150,  spent: 188,  type: 'expense' },
  { id: 'b-6',  name: 'Subscriptions', category: 'misc',  allocated: 80,   spent: 77,   type: 'expense' },
]

export const mockActions: Action[] = [
  {
    id: 'a1',
    title: 'Extra payment to Chase Sapphire',
    description: 'Apply $800 extra to your highest-rate card this cycle. Saves ~$210 in interest.',
    amount: 800,
    priority: 'high',
    type: 'payment',
    status: 'pending',
    dueDate: '2026-08-15',
  },
  {
    id: 'a2',
    title: 'Rebalance emergency fund',
    description: 'Move $400 from general savings to dedicated emergency reserve.',
    amount: 400,
    priority: 'medium',
    type: 'transfer',
    status: 'pending',
  },
  {
    id: 'a3',
    title: 'Review grocery budget',
    description: 'Grocery spend exceeded budget by 18% last month. Review and adjust.',
    amount: 0,
    priority: 'low',
    type: 'review',
    status: 'pending',
  },
  {
    id: 'a4',
    title: 'Navient extra payment',
    description: 'Cleared — auto-payment confirmed for last cycle.',
    amount: 250,
    priority: 'medium',
    type: 'payment',
    status: 'executed',
  },
]

export const mockCashflow: CashflowEntry[] = Array.from({ length: 12 }, (_, i) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const income   = 5800 + Math.round((Math.random() - 0.4) * 600)
  const expenses = 3900 + Math.round((Math.random() - 0.4) * 400)
  return { month: months[i], income, expenses, net: income - expenses }
})

export const mockReports: WealthReport[] = Array.from({ length: 12 }, (_, i) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const netWorth      = -22000 + i * 1800 + Math.round(Math.random() * 400)
  const totalDebt     = 24600 - i * 1400 - Math.round(Math.random() * 200)
  const interestSaved = i * 320 + Math.round(Math.random() * 120)
  return { month: months[i], netWorth, totalDebt, interestSaved }
})

export const handlers = [
  http.get(`${BASE}/api/dashboard`, () => HttpResponse.json(mockDashboard)),
  http.get(`${BASE}/api/accounts`,  () => HttpResponse.json(mockAccounts)),
  http.get(`${BASE}/api/budgets`,   () => HttpResponse.json(mockBudgets)),
  http.get(`${BASE}/api/actions`,   () => HttpResponse.json(mockActions)),
  http.get(`${BASE}/api/cashflow`,  () => HttpResponse.json(mockCashflow)),
  http.get(`${BASE}/api/reports`,   () => HttpResponse.json(mockReports)),

  http.patch<{ id: string }>(`${BASE}/api/actions/:id`, async ({ params, request }) => {
    const body = await request.json() as { status: string }
    const action = mockActions.find(a => a.id === params.id)
    if (!action) return new HttpResponse(null, { status: 404 })
    action.status = body.status as Action['status']
    return HttpResponse.json(action)
  }),

  http.post(`${BASE}/api/advisor/chat`, () =>
    HttpResponse.json({
      message:
        "Great question. Based on your current cashflow and debt schedule, I'd recommend prioritising the Chase Sapphire card first due to its 22.74% APR — that's the avalanche method. Once that's cleared, redirect those payments to the student loan.",
    }),
  ),
]
