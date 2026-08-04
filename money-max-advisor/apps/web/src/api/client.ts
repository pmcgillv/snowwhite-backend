const BASE_URL = (import.meta.env?.VITE_API_URL as string | undefined) ?? 'http://localhost:4000'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    throw new ApiError(res.status, `API error ${res.status}: ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

/* ── Types ──────────────────────────────────────────────── */

export interface Account {
  id: string
  name: string
  institution: string
  type: 'checking' | 'savings' | 'credit_card' | 'line_of_credit' | 'loan' | 'investment'
  balance: number
  limit?: number
  interestRate?: number
  connected: boolean
}

export interface DashboardSummary {
  debtFreeDate: string
  interestSaved: number
  discretionaryIncome: number
  emergencyFundMonths: number
  nextActions: Action[]
}

export interface Action {
  id: string
  title: string
  description: string
  amount: number
  priority: 'high' | 'medium' | 'low'
  type: 'transfer' | 'payment' | 'rebalance' | 'review'
  status: 'pending' | 'approved' | 'executed' | 'dismissed'
  dueDate?: string
}

export interface Budget {
  id: string
  name: string
  category: string
  allocated: number
  spent: number
  type: 'expense' | 'income'
}

export interface CashflowEntry {
  month: string
  income: number
  expenses: number
  net: number
}

export interface WealthReport {
  month: string
  netWorth: number
  totalDebt: number
  interestSaved: number
}

export interface AdvisorMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AdvisorChatResponse {
  message: string
}
