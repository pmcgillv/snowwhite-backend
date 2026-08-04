import { Link } from 'react-router-dom'
import { useFetch } from '../hooks/useFetch'
import { LoadingState, ErrorState } from '../components/LoadingState'
import type { DashboardSummary } from '../api/client'

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

export default function Dashboard() {
  const { data, loading, error, refetch } = useFetch<DashboardSummary>('/api/dashboard')

  if (loading) return <LoadingState text="Loading your dashboard…" />
  if (error || !data) return <ErrorState message={error ?? 'No data'} onRetry={refetch} />

  const priorityMap = { high: 'high', medium: 'medium', low: 'low' } as const

  return (
    <div className="app-page page-enter" role="main" aria-labelledby="dash-title">
      <header className="app-page__header">
        <h1 className="app-page__title" id="dash-title">Dashboard</h1>
        <p className="app-page__subtitle">Your financial snapshot at a glance.</p>
      </header>

      {/* KPI row */}
      <div className="grid-4" style={{ marginBottom: 'var(--sp-8)' }} role="list" aria-label="Key metrics">
        <article className="stat-card" role="listitem" aria-label="Debt-free date">
          <div className="stat-card__label">Debt-Free Date</div>
          <div className="stat-card__value debt-pulse display">
            {fmtDate(data.debtFreeDate)}
          </div>
          <div className="stat-card__sub">Projected payoff</div>
          <div className="stat-card__trend stat-card__trend--up">
            On track ↑
          </div>
        </article>

        <article className="stat-card" role="listitem" aria-label="Projected interest saved">
          <div className="stat-card__label">Interest Saved</div>
          <div className="stat-card__value display">{fmt(data.interestSaved)}</div>
          <div className="stat-card__sub">Vs. minimum payments</div>
          <div className="stat-card__trend stat-card__trend--up">
            +{fmt(Math.round(data.interestSaved * 0.07))} this month
          </div>
        </article>

        <article className="stat-card" role="listitem" aria-label="Discretionary income">
          <div className="stat-card__label">Discretionary Income</div>
          <div className="stat-card__value display">{fmt(data.discretionaryIncome)}</div>
          <div className="stat-card__sub">After bills & minimums</div>
        </article>

        <article className="stat-card" role="listitem" aria-label="Emergency fund coverage">
          <div className="stat-card__label">Emergency Fund</div>
          <div className="stat-card__value display">{data.emergencyFundMonths.toFixed(1)}mo</div>
          <div className="stat-card__sub">Coverage at current spend</div>
          <div className={`stat-card__trend ${data.emergencyFundMonths >= 3 ? 'stat-card__trend--up' : 'stat-card__trend--down'}`}>
            {data.emergencyFundMonths >= 3 ? 'Healthy' : 'Below target'}
          </div>
        </article>
      </div>

      {/* Next actions preview */}
      <section aria-labelledby="next-actions-heading">
        <div className="section-header">
          <h2 className="section-header__title" id="next-actions-heading">Next Actions</h2>
          <Link to="/app/actions" className="section-header__action">
            View all →
          </Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          {data.nextActions.slice(0, 4).map((action, i) => (
            <article
              key={action.id}
              className={`action-item stagger-item`}
              style={{ animationDelay: `${i * 60}ms` }}
              aria-label={`Action: ${action.title}`}
            >
              <div className="action-item__header">
                <div
                  className={`action-item__priority action-item__priority--${priorityMap[action.priority]}`}
                  aria-label={`Priority: ${action.priority}`}
                />
                <div className="action-item__body">
                  <div className="action-item__title">{action.title}</div>
                  <div className="action-item__desc">{action.description}</div>
                </div>
                <div className="action-item__amount">{fmt(action.amount)}</div>
              </div>
              <div className="action-item__controls">
                <span className={`badge badge-${action.status === 'pending' ? 'warning' : action.status === 'executed' ? 'teal' : 'muted'}`}>
                  {action.status}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
