import { Link } from 'react-router-dom'
import { useFetch } from '../hooks/useFetch'
import { LoadingState, ErrorState } from '../components/LoadingState'
import type { ActionItem, DashboardSummary } from '../api/client'

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long' }).format(
    new Date(iso),
  )
}

function priorityBand(priority: number): 'high' | 'medium' | 'low' {
  if (priority <= 3) return 'high'
  if (priority <= 6) return 'medium'
  return 'low'
}

function actionTitle(action: ActionItem): string {
  switch (action.type) {
    case 'debt_payment':
      return 'Debt payment'
    case 'sweep':
      return 'Cash sweep'
    case 'reserve':
      return 'Emergency reserve'
    case 'transfer':
      return 'Transfer'
    default: {
      const _exhaustive: never = action.type
      return String(_exhaustive)
    }
  }
}

export default function Dashboard() {
  const dash = useFetch<DashboardSummary>('/api/dashboard')
  const actionsRes = useFetch<{ actions: ActionItem[] }>('/api/actions')

  if (dash.loading || actionsRes.loading) {
    return <LoadingState text="Loading your dashboard…" />
  }
  if (dash.error || !dash.data) {
    return <ErrorState message={dash.error ?? 'No data'} onRetry={dash.refetch} />
  }

  const data = dash.data
  const nextActions = (actionsRes.data?.actions ?? [])
    .filter((a) => a.status === 'pending')
    .slice(0, 4)
  const emergencyMonths =
    data.monthlyExpenses > 0 ? data.emergencyFund / data.monthlyExpenses : 0

  return (
    <div className="app-page page-enter" role="main" aria-labelledby="dash-title">
      <header className="app-page__header">
        <h1 className="app-page__title" id="dash-title">Dashboard</h1>
        <p className="app-page__subtitle">Your financial snapshot at a glance.</p>
      </header>

      <div className="grid-4" style={{ marginBottom: 'var(--sp-8)' }} role="list" aria-label="Key metrics">
        <article className="stat-card" role="listitem" aria-label="Debt-free date">
          <div className="stat-card__label">Debt-Free Date</div>
          <div className="stat-card__value debt-pulse display">
            {fmtDate(data.debtFreeDate)}
          </div>
          <div className="stat-card__sub">Projected payoff</div>
        </article>

        <article className="stat-card" role="listitem" aria-label="Projected interest saved">
          <div className="stat-card__label">Interest Saved</div>
          <div className="stat-card__value display">{fmt(data.interestSavedProjected)}</div>
          <div className="stat-card__sub">Vs. minimum-only path</div>
        </article>

        <article className="stat-card" role="listitem" aria-label="Discretionary income">
          <div className="stat-card__label">Discretionary Income</div>
          <div className="stat-card__value display">{fmt(data.discretionaryIncome)}</div>
          <div className="stat-card__sub">After bills & minimums</div>
        </article>

        <article className="stat-card" role="listitem" aria-label="Emergency fund coverage">
          <div className="stat-card__label">Emergency Fund</div>
          <div className="stat-card__value display">{emergencyMonths.toFixed(1)}mo</div>
          <div className="stat-card__sub">{fmt(data.emergencyFund)} liquid</div>
          <div className={`stat-card__trend ${emergencyMonths >= 3 ? 'stat-card__trend--up' : 'stat-card__trend--down'}`}>
            {emergencyMonths >= 3 ? 'Healthy' : 'Below target'}
          </div>
        </article>
      </div>

      <section aria-labelledby="next-actions-heading">
        <div className="section-header">
          <h2 className="section-header__title" id="next-actions-heading">Next Actions</h2>
          <Link to="/app/actions" className="section-header__action">
            View all →
          </Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          {nextActions.length === 0 && (
            <p className="app-page__subtitle">No pending actions right now.</p>
          )}
          {nextActions.map((action, i) => {
            const band = priorityBand(action.priority)
            return (
              <article
                key={action.id}
                className="action-item stagger-item"
                style={{ animationDelay: `${i * 60}ms` }}
                aria-label={`Action: ${actionTitle(action)}`}
              >
                <div className="action-item__header">
                  <div
                    className={`action-item__priority action-item__priority--${band}`}
                    aria-label={`Priority: ${band}`}
                  />
                  <div className="action-item__body">
                    <div className="action-item__title">{actionTitle(action)}</div>
                    <div className="action-item__desc">{action.reason}</div>
                  </div>
                  <div className="action-item__amount">{fmt(action.amount)}</div>
                </div>
                <div className="action-item__controls">
                  <span className="badge badge-warning">{action.status}</span>
                  <span className="badge badge-muted">
                    saves {fmt(action.interestImpact)}
                  </span>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
