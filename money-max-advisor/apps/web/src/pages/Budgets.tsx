import { useFetch } from '../hooks/useFetch'
import { LoadingState, ErrorState, EmptyState } from '../components/LoadingState'
import type { Bill, Budget, IncomeItem } from '../api/client'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)

function pct(spent: number, allocated: number) {
  if (allocated === 0) return 0
  return Math.min(100, Math.round((spent / allocated) * 100))
}

function expenseBarClass(p: number) {
  if (p >= 100) return 'budget-bar--danger'
  if (p >= 80) return 'budget-bar--warning'
  return ''
}

function incomeBarClass(p: number) {
  if (p >= 100) return 'budget-bar--income-full'
  if (p >= 50) return 'budget-bar--income-partial'
  return 'budget-bar--income-low'
}

const FREQ_LABELS: Record<string, string> = {
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
  bimonthly: 'Bi-monthly',
}

function groupByCategory(budgets: Budget[]): Map<string, Budget[]> {
  const map = new Map<string, Budget[]>()
  for (const b of budgets) {
    const cat = b.category || 'Other'
    const existing = map.get(cat) ?? []
    existing.push(b)
    map.set(cat, existing)
  }
  return map
}

export default function Budgets() {
  const { data, loading, error, refetch } = useFetch<{
    budgets: Budget[]
    bills: Bill[]
    incomes: IncomeItem[]
  }>('/api/budgets')

  if (loading) return <LoadingState text="Loading budgets…" />
  if (error || !data) return <ErrorState message={error ?? 'No data'} onRetry={refetch} />

  const budgets = data.budgets
  const bills = data.bills
  const incomes = data.incomes ?? []

  if (budgets.length === 0 && incomes.length === 0) {
    return <EmptyState text="No budget categories set up." />
  }

  const totalAllocated = budgets.reduce((s, b) => s + b.allocatedMonthly, 0)
  const totalSpent = budgets.reduce((s, b) => s + b.spentThisMonth, 0)
  const totalExpectedIncome = incomes.reduce((s, i) => s + i.expectedMonthly, 0)
  const totalReceivedIncome = incomes.reduce((s, i) => s + i.receivedThisMonth, 0)

  const categoryMap = groupByCategory(budgets)

  return (
    <div className="app-page page-enter" role="main" aria-labelledby="budgets-title">
      <header className="app-page__header">
        <h1 className="app-page__title" id="budgets-title">
          Budget
        </h1>
        <p className="app-page__subtitle">Income sources and expense categories for this month.</p>
      </header>

      {/* Summary cards */}
      <div className="grid-3" style={{ marginBottom: 'var(--sp-8)' }}>
        <article className="stat-card">
          <div className="stat-card__label">Income Received</div>
          <div className="stat-card__value display" style={{ color: 'var(--teal)' }}>
            {fmt(totalReceivedIncome)}
          </div>
          <div className="stat-card__sub">of {fmt(totalExpectedIncome)} expected</div>
        </article>
        <article className="stat-card">
          <div className="stat-card__label">Expenses Spent</div>
          <div
            className="stat-card__value display"
            style={{ color: totalSpent > totalAllocated ? '#E06A54' : 'var(--sand)' }}
          >
            {fmt(totalSpent)}
          </div>
          <div className="stat-card__sub">of {fmt(totalAllocated)} allocated</div>
        </article>
        <article className="stat-card">
          <div className="stat-card__label">Recurring Bills</div>
          <div className="stat-card__value display">{bills.length}</div>
          <div className="stat-card__sub">
            {fmt(bills.reduce((s, b) => s + b.amount, 0))}/mo total
          </div>
        </article>
      </div>

      {/* Income section */}
      {incomes.length > 0 && (
        <section style={{ marginBottom: 'var(--sp-8)' }} aria-labelledby="income-section">
          <div className="section-header">
            <h2 className="section-header__title" id="income-section">
              Income
            </h2>
            <span className="badge badge-teal">
              {fmt(totalReceivedIncome)} / {fmt(totalExpectedIncome)}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            {incomes.map((inc) => {
              const p = pct(inc.receivedThisMonth, inc.expectedMonthly)
              return (
                <article key={inc.id} className="budget-row budget-row--income">
                  <div className="budget-row__header">
                    <div>
                      <div className="budget-row__name">{inc.name}</div>
                      <div className="budget-row__meta">
                        {FREQ_LABELS[inc.frequency] ?? inc.frequency}
                      </div>
                    </div>
                    <div className="budget-row__amounts">
                      <span>{fmt(inc.receivedThisMonth)}</span>{' '}
                      <span className="budget-row__of">of {fmt(inc.expectedMonthly)}</span>
                    </div>
                  </div>
                  <div className="budget-row__bar-track">
                    <div
                      className={`budget-row__bar-fill budget-row__bar-fill--income ${incomeBarClass(p)}`}
                      style={{ width: `${p}%` }}
                      role="progressbar"
                      aria-valuenow={p}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${inc.name}: ${p}% received`}
                    />
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}

      {/* Expense section — grouped by category */}
      {budgets.length > 0 && (
        <section aria-labelledby="expenses-section">
          <div className="section-header">
            <h2 className="section-header__title" id="expenses-section">
              Expenses
            </h2>
            <span
              className={`badge ${totalSpent > totalAllocated ? 'badge-warning' : 'badge-muted'}`}
            >
              {fmt(totalSpent)} / {fmt(totalAllocated)}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
            {Array.from(categoryMap.entries()).map(([category, items]) => {
              const catSpent = items.reduce((s, b) => s + b.spentThisMonth, 0)
              const catAllocated = items.reduce((s, b) => s + b.allocatedMonthly, 0)
              const catPct = pct(catSpent, catAllocated)

              return (
                <div key={category} className="budget-category">
                  <div className="budget-category__header">
                    <div className="budget-category__name">{category}</div>
                    <div className="budget-category__total">
                      {fmt(catSpent)}{' '}
                      <span className="budget-row__of">/ {fmt(catAllocated)}</span>
                    </div>
                  </div>

                  {/* Category rollup bar */}
                  <div className="budget-row__bar-track" style={{ marginBottom: 'var(--sp-3)' }}>
                    <div
                      className={`budget-row__bar-fill ${expenseBarClass(catPct)}`}
                      style={{ width: `${catPct}%` }}
                      role="progressbar"
                      aria-valuenow={catPct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${category}: ${catPct}% spent`}
                    />
                  </div>

                  {/* Individual items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                    {items.map((b) => {
                      const p = pct(b.spentThisMonth, b.allocatedMonthly)
                      return (
                        <article key={b.id} className="budget-row budget-row--nested">
                          <div className="budget-row__header">
                            <div className="budget-row__name budget-row__name--sub">{b.name}</div>
                            <div className="budget-row__amounts">
                              <span>{fmt(b.spentThisMonth)}</span>{' '}
                              <span className="budget-row__of">/ {fmt(b.allocatedMonthly)}</span>
                            </div>
                          </div>
                          <div className="budget-row__bar-track">
                            <div
                              className={`budget-row__bar-fill ${expenseBarClass(p)}`}
                              style={{ width: `${p}%` }}
                              role="progressbar"
                              aria-valuenow={p}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label={`${b.name}: ${p}% of budget`}
                            />
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Bills */}
      {bills.length > 0 && (
        <section style={{ marginTop: 'var(--sp-8)' }}>
          <h2 className="section-header__title" style={{ marginBottom: 'var(--sp-4)' }}>
            Recurring Bills
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            {bills.map((bill) => (
              <article key={bill.id} className="account-row">
                <div className="account-row__info">
                  <div className="account-row__name">{bill.name}</div>
                  <div className="account-row__meta">
                    Due day {bill.dueDay} · {bill.frequency}
                    {bill.autopay ? ' · Autopay on' : ''}
                  </div>
                </div>
                <div className="account-row__balance">{fmt(bill.amount)}</div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
