// ── Account ─────────────────────────────────────────────────────────────────

export type AccountType =
  | 'checking'
  | 'savings'
  | 'credit'
  | 'loan'
  | 'mortgage'
  | 'heloc'
  | 'investment';

/** New mortgages / HELOCs often start interest-only — principal stays flat until it ends. */
export interface InterestOnlyPeriod {
  active: boolean;
  /** Duration in months from startDate (or from “now” if startDate omitted). */
  months?: number;
  startDate?: string; // ISO date
  endDate?: string;   // ISO date — preferred when known
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;           // positive = asset, negative = owed (for credit/loan/mortgage)
  interestRateAPR: number;   // 0 for non-interest accounts
  institution: string;
  creditLimit?: number;      // credit accounts
  minimumPayment?: number;   // debt accounts
  dueDay?: number;           // day of month payment is due (1-31)
  interestOnlyPeriod?: InterestOnlyPeriod;
}

/** True when the account is currently in an interest-only window. */
export function isInterestOnlyActive(
  account: Pick<Account, 'interestOnlyPeriod'>,
  asOf: Date = new Date(),
): boolean {
  const io = account.interestOnlyPeriod;
  if (!io?.active) return false;
  if (io.endDate) {
    const end = new Date(io.endDate);
    end.setHours(23, 59, 59, 999);
    return asOf <= end;
  }
  if (io.months != null && io.months > 0) {
    if (io.startDate) {
      const end = new Date(io.startDate);
      end.setMonth(end.getMonth() + io.months);
      end.setHours(23, 59, 59, 999);
      return asOf <= end;
    }
    // Active with months but no dates → treat as currently in period
    return true;
  }
  return true;
}

// ── Budget / Bill / IncomeStream ─────────────────────────────────────────────

export type BudgetCategory =
  | 'housing'
  | 'transportation'
  | 'food'
  | 'utilities'
  | 'healthcare'
  | 'personal'
  | 'entertainment'
  | 'education'
  | 'savings'
  | 'debt'
  | 'other';

export interface Budget {
  id: string;
  name: string;
  category: BudgetCategory;
  allocatedMonthly: number;
  spentThisMonth: number;
}

export type BillFrequency = 'monthly' | 'bi-weekly' | 'weekly' | 'annual' | 'quarterly';

export interface Bill {
  id: string;
  name: string;
  amount: number;
  frequency: BillFrequency;
  dueDay: number;            // day of month (1-31)
  accountId: string;         // which account it pulls from
  category: BudgetCategory;
  autopay: boolean;
}

export interface IncomeStream {
  id: string;
  name: string;
  grossAmount: number;
  netAmount: number;
  frequency: BillFrequency;
  nextPayDate: string;       // ISO date string
  destinationAccountIds: Array<{ accountId: string; amount: number }>;
}

// ── ActionItem ────────────────────────────────────────────────────────────────

export type ActionType = 'transfer' | 'debt_payment' | 'sweep' | 'reserve';
export type ActionStatus = 'pending' | 'approved' | 'executed' | 'dismissed';

export interface ActionItem {
  id: string;
  type: ActionType;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  suggestedDate: string;     // ISO date string
  reason: string;
  interestImpact: number;    // dollars of interest saved (positive = good)
  status: ActionStatus;
  priority: number;          // lower = higher priority
}

// ── DashboardSummary ──────────────────────────────────────────────────────────

export interface DashboardSummary {
  debtFreeDate: string;              // ISO date string estimate
  totalDebt: number;                 // sum of all debt balances (positive number)
  interestSavedProjected: number;    // projected interest savings vs minimum payments
  discretionaryIncome: number;       // monthly surplus after bills & min payments
  emergencyFund: number;             // current liquid savings
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
}

// ── Cashflow ──────────────────────────────────────────────────────────────────

export interface CashflowPoint {
  date: string;              // ISO date string
  inflow: number;
  outflow: number;
  balance: number;           // running checking balance
  label?: string;            // e.g. "Paycheck", "Mortgage"
}

// ── Reports ───────────────────────────────────────────────────────────────────

export interface WealthSnapshot {
  date: string;
  assets: number;
  liabilities: number;
  netWorth: number;
}

export interface ReportSummary {
  period: string;
  totalInterestPaid: number;
  totalPrincipalPaid: number;
  wealthTrajectory: WealthSnapshot[];
  savingsRate: number;       // percentage (0-100)
  debtPayoffProgress: number;// percentage (0-100)
}

// ── Method / Settings ─────────────────────────────────────────────────────────

export type MethodMode = 'checking_savings' | 'line_of_credit';

export interface AdvisorSettings {
  methodMode: MethodMode;
  paycheckSplitHints: Array<{
    accountId: string;
    percentOrFixed: 'percent' | 'fixed';
    value: number;
  }>;
  currency: string;
  timezone: string;
}

// ── Advisor Chat ──────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  history?: ChatMessage[];
}

export interface ChatResponse {
  reply: string;
  suggestedActions?: Array<{
    label: string;
    actionItemId?: string;
    prompt?: string;
  }>;
}

// ── Setup ─────────────────────────────────────────────────────────────────────

export interface SetupStatus {
  completed: boolean;
  steps: Array<{
    key: string;
    label: string;
    done: boolean;
  }>;
  mode: 'demo' | 'live';
}

// ── Integration ───────────────────────────────────────────────────────────────

export interface IntegrationStatus {
  connected: boolean;
  mode: 'demo' | 'live';
  lastSync?: string;
  error?: string;
}
