import { useFetch } from '../hooks/useFetch'
import { LoadingState, ErrorState, EmptyState } from '../components/LoadingState'
import type { Budget } from '../api/client'

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function pct(spent: number, allocated: number) {
  if (allocated === 0) return 0
  return Math.min(100, Math.round((spent / allocated) * 100))
}

function barClass(p: number) {
  if (p >= 100) return 'budget-row__bar-fill--danger'
  if (p >= 80)  return 'budget-row__bar-fill--warning'
  return ''
}

export default function Budgets() {
  const { data: budgets, loading, error, refetch } = useFetch<Budget[]>('/api/budgets')

  if (loading) return <LoadingState text="Loading budgets…" />
  if (error || !budgets) return <ErrorState message={error ?? 'No data'} onRetry={refetch} />
  if (budgets.length === 0) return <EmptyState text="No budget categories set up." />

  const income   = budgets.filter(b => b.type === 'income')
  const expenses = budgets.filter(b => b.type === 'expense')

  const totalIncome  = income.reduce((s, b) => s + b.allocated, 0)
  const totalExpense = expenses.reduce((s, b) => s + b.spent, 0)

  return (
    <div className="app-page page-enter" role="main" aria-labelledby="budgets-title">
      <header className="app-page__header">
        <h1 className="app-page__title" id="budgets-title">Budgets</h1>
        <p className="app-page__subtitle">Bills, expenses, and income streams.</p>
      </header>

      {/* Summary bar */}
      <div className="grid-3" style={{ marginBottom: 'var(--sp-8)' }}>
        <article className="stat-card">
          <div className="stat-card__label">Monthly Income</div>
          <div className="stat-card__value display">{fmt(totalIncome)}</div>
        </article>
        <article className="stat-card">
          <div className="stat-card__label">Total Expenses</div>
          <div className="stat-card__value display">{fmt(totalExpense)}</div>
          <div className={`stat-card__trend ${totalExpense > totalIncome ? 'stat-card__trend--down' : 'stat-card__trend--up'}`}>
            {fmt(Math.abs(totalIncome - totalExpense))} {totalExpense > totalIncome ? 'over budget' : 'remaining'}
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-card__label">Savings Rate</div>
          <div className="stat-card__value display">
            {totalIncome > 0 ? Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100)) : 0}%
          </div>
        </article>
      </div>

      {income.length > 0 && (
        <section aria-labelledby="income-heading" style={{ marginBottom: 'var(--sp-8)' }}>
          <div className="section-header">
            <h2 className="section-header__title" id="income-heading">Income Streams</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            {income.map(b => (
              <BudgetRow key={b.id} budget={b} />
            ))}
          </div>
        </section>
      )}

      {expenses.length > 0 && (
        <section aria-labelledby="expenses-heading">
          <div className="section-header">
            <h2 className="section-header__title" id="expenses-heading">Expense Budgets</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            {expenses.map(b => (
              <BudgetRow key={b.id} budget={b} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function BudgetRow({ budget }: { budget: Budget }) {
  const p = pct(budget.spent, budget.allocated)
  return (
    <article className="budget-row stagger-item" aria-label={`Budget: ${budget.name}`}>
      <div className="budget-row__header">
        <span className="budget-row__name">{budget.name}</span>
        <span className="budget-row__amounts">
          <span>{fmt(budget.spent)}</span> / {fmt(budget.allocated)}
          {budget.type === 'expense' && (
            <span style={{ marginLeft: 'var(--sp-2)' }} className={`badge ${p >= 100 ? 'badge-warning' : 'badge-muted'}`}>
              {p}%
            </span>
          )}
        </span>
      </div>
      {budget.type === 'expense' && (
        <div className="budget-row__bar-track" role="progressbar" aria-valuenow={p} aria-valuemin={0} aria-valuemax={100} aria-label={`${budget.name} spending progress`}>
          <div
            className={`budget-row__bar-fill ${barClass(p)}`}
            style={{ width: `${p}%` }}
          />
        </div>
      )}
    </article>
  )
}
