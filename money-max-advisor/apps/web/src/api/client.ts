// Default to same-origin so Cursor VM / remote previews work via the Vite proxy.
// Override with VITE_API_URL only when the API is on a different host.
const BASE_URL = (import.meta.env?.VITE_API_URL as string | undefined) ?? ''

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
  const headers = new Headers(init?.headers)
  const hasBody = init?.body != null && init.body !== ''
  // Fastify rejects Content-Type: application/json with an empty body (400).
  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const errBody = (await res.json()) as { message?: string; error?: string }
      detail = errBody.message ?? errBody.error ?? detail
    } catch {
      // keep statusText
    }
    throw new ApiError(res.status, `API error ${res.status}: ${detail}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(
      path,
      body === undefined
        ? { method: 'POST' }
        : {
            method: 'POST',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' },
          },
    ),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

/* ── Types aligned with apps/api + packages/shared ───────── */

export type AccountType =
  | 'checking'
  | 'savings'
  | 'credit'
  | 'loan'
  | 'mortgage'
  | 'heloc'
  | 'investment'

export interface InterestOnlyPeriod {
  active: boolean
  months?: number
  startDate?: string
  endDate?: string
}

export interface Account {
  id: string
  name: string
  type: AccountType
  balance: number
  interestRateAPR: number
  institution: string
  creditLimit?: number
  minimumPayment?: number
  dueDay?: number
  interestOnlyPeriod?: InterestOnlyPeriod
}

export interface DashboardSummary {
  debtFreeDate: string
  totalDebt: number
  interestSavedProjected: number
  interestSavedActual?: number
  discretionaryIncome: number
  emergencyFund: number
  netWorth: number
  monthlyIncome: number
  monthlyExpenses: number
}

export interface IncomeItem {
  id: string
  name: string
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'bimonthly'
  expectedMonthly: number
  receivedThisMonth: number
}

export type ActionType = 'transfer' | 'debt_payment' | 'sweep' | 'reserve'
export type ActionStatus = 'pending' | 'approved' | 'executed' | 'dismissed'

export interface ActionItem {
  id: string
  type: ActionType
  fromAccountId: string
  toAccountId: string
  amount: number
  suggestedDate: string
  reason: string
  interestImpact: number
  status: ActionStatus
  priority: number
}

export interface Budget {
  id: string
  name: string
  category: string
  allocatedMonthly: number
  spentThisMonth: number
}

export interface Bill {
  id: string
  name: string
  amount: number
  frequency: string
  dueDay: number
  accountId: string
  category: string
  autopay: boolean
}

export interface CashflowPoint {
  date: string
  inflow: number
  outflow: number
  balance: number
  label?: string
}

export interface WealthSnapshot {
  date: string
  assets: number
  liabilities: number
  netWorth: number
}

export interface ReportSummary {
  period: string
  totalInterestPaid: number
  totalPrincipalPaid: number
  wealthTrajectory: WealthSnapshot[]
  savingsRate: number
  debtPayoffProgress: number
}

export interface AdvisorMessage {
  role: 'user' | 'assistant'
  content: string
}
