import { useFetch } from '../hooks/useFetch'
import { LoadingState, ErrorState, EmptyState } from '../components/LoadingState'
import type { Bill, Budget } from '../api/client'

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

function pct(spent: number, allocated: number) {
  if (allocated === 0) return 0
  return Math.min(100, Math.round((spent / allocated) * 100))
}

function barClass(p: number) {
  if (p >= 100) return 'budget-row__bar-fill--danger'
  if (p >= 80) return 'budget-row__bar-fill--warning'
  return ''
}

export default function Budgets() {
  const { data, loading, error, refetch } = useFetch<{ budgets: Budget[]; bills: Bill[] }>(
    '/api/budgets',
  )

  if (loading) return <LoadingState text="Loading budgets…" />
  if (error || !data) return <ErrorState message={error ?? 'No data'} onRetry={refetch} />

  const budgets = data.budgets
  const bills = data.bills
  if (budgets.length === 0) return <EmptyState text="No budget categories set up." />

  const totalAllocated = budgets.reduce((s, b) => s + b.allocatedMonthly, 0)
  const totalSpent = budgets.reduce((s, b) => s + b.spentThisMonth, 0)

  return (
    <div className="app-page page-enter" role="main" aria-labelledby="budgets-title">
      <header className="app-page__header">
        <h1 className="app-page__title" id="budgets-title">Budgets</h1>
        <p className="app-page__subtitle">Expense categories and recurring bills.</p>
      </header>

      <div className="grid-3" style={{ marginBottom: 'var(--sp-8)' }}>
        <article className="stat-card">
          <div className="stat-card__label">Allocated</div>
          <div className="stat-card__value display">{fmt(totalAllocated)}</div>
        </article>
        <article className="stat-card">
          <div className="stat-card__label">Spent this month</div>
          <div className="stat-card__value display">{fmt(totalSpent)}</div>
        </article>
        <article className="stat-card">
          <div className="stat-card__label">Recurring bills</div>
          <div className="stat-card__value display">{bills.length}</div>
        </article>
      </div>

      <section style={{ marginBottom: 'var(--sp-8)' }}>
        <h2 className="section-header__title">Categories</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          {budgets.map((b) => {
            const p = pct(b.spentThisMonth, b.allocatedMonthly)
            return (
              <article key={b.id} className="budget-row">
                <div className="budget-row__header">
                  <div>
                    <div className="budget-row__name">{b.name}</div>
                    <div className="budget-row__meta">{b.category}</div>
                  </div>
                  <div className="budget-row__amounts">
                    {fmt(b.spentThisMonth)} / {fmt(b.allocatedMonthly)}
                  </div>
                </div>
                <div className="budget-row__bar">
                  <div
                    className={`budget-row__bar-fill ${barClass(p)}`}
                    style={{ width: `${p}%` }}
                  />
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {bills.length > 0 && (
        <section>
          <h2 className="section-header__title">Bills</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            {bills.map((bill) => (
              <article key={bill.id} className="account-row">
                <div>
                  <div className="account-row__name">{bill.name}</div>
                  <div className="account-row__meta">
                    Due day {bill.dueDay} · {bill.frequency}
                    {bill.autopay ? ' · Autopay' : ''}
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
