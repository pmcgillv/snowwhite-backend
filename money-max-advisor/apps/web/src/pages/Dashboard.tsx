import { Link } from 'react-router-dom'
import { useFetch } from '../hooks/useFetch'
import { LoadingState, ErrorState } from '../components/LoadingState'
import { IconShield, IconArrowRight } from '../components/Icons'
import type { ActionItem, DashboardSummary } from '../api/client'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long' }).format(new Date(iso))

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
  const emergencyMonths = data.monthlyExpenses > 0 ? data.emergencyFund / data.monthlyExpenses : 0

  return (
    <div className="app-page page-enter" role="main" aria-labelledby="dash-title">
      {/* Hero row */}
      <header className="app-page__header dash-hero">
        <div className="dash-hero__main">
          <div className="dash-hero__eyebrow">Projected Debt-Free Date</div>
          <h1 className="dash-hero__date debt-pulse display" id="dash-title">
            {fmtDate(data.debtFreeDate)}
          </h1>
          <p className="dash-hero__sub">
            Net Worth{' '}
            <span className={data.netWorth >= 0 ? 'text-teal' : 'text-muted'}>
              {fmt(data.netWorth)}
            </span>{' '}
            · Total Debt {fmt(data.totalDebt)}
          </p>
        </div>
        <div className="dash-hero__cta">
          <Link to="/app/actions" className="btn btn-primary">
            View Action Plan
            <IconArrowRight size={16} />
          </Link>
          <Link to="/app/budgets" className="btn btn-ghost" style={{ marginTop: 'var(--sp-2)' }}>
            Review Budget
          </Link>
        </div>
      </header>

      {/* KPI context cards */}
      <div
        className="grid-4"
        style={{ marginBottom: 'var(--sp-8)' }}
        role="list"
        aria-label="Key metrics"
      >
        <article className="stat-card" role="listitem" aria-label="Debt-Free Date">
          <div className="stat-card__label">
            Debt-Free Date
          </div>
          <div className="stat-card__value debt-pulse display">{fmtDate(data.debtFreeDate)}</div>
          <div className="stat-card__sub">Projected payoff</div>
        </article>

        <article className="stat-card" role="listitem" aria-label="Projected interest saved">
          <div className="stat-card__label">
            Interest Saved
          </div>
          <div className="stat-card__value display">{fmt(data.interestSavedProjected)}</div>
          <div className="stat-card__sub">Potential vs. minimum-only path</div>
        </article>

        <article className="stat-card" role="listitem" aria-label="Discretionary income">
          <div className="stat-card__label">Discretionary Income</div>
          <div className="stat-card__value display">{fmt(data.discretionaryIncome)}</div>
          <div className="stat-card__sub">After bills &amp; minimums</div>
        </article>

        <article className="stat-card" role="listitem" aria-label="Emergency fund coverage">
          <div className="stat-card__label">Emergency Fund</div>
          <div className="stat-card__value display">{emergencyMonths.toFixed(1)}mo</div>
          <div className="stat-card__sub">{fmt(data.emergencyFund)} liquid</div>
          <div
            className={`stat-card__trend ${
              emergencyMonths >= 3 ? 'stat-card__trend--up' : 'stat-card__trend--down'
            }`}
          >
            {emergencyMonths >= 3 ? 'Healthy' : 'Below target'}
          </div>
        </article>
      </div>

      {/* Next actions preview */}
      <section aria-labelledby="next-actions-heading">
        <div className="section-header">
          <h2 className="section-header__title" id="next-actions-heading">
            Next Actions
          </h2>
          <Link to="/app/actions" className="section-header__action">
            View all →
          </Link>
        </div>

        <div className="readonly-notice" role="note" aria-label="Safety notice">
          <span className="readonly-notice__icon" aria-hidden="true">
            <IconShield size={14} />
          </span>
          <div className="readonly-notice__text">
            <strong>Your money never moves automatically.</strong> Approve actions when you are
            ready to execute them yourself at your bank.
          </div>
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
                    <div className="action-item__meta">
                      <span>Suggested {action.suggestedDate}</span>
                      <span>Saves {fmt(action.interestImpact)} interest</span>
                    </div>
                  </div>
                  <div className="action-item__amount">{fmt(action.amount)}</div>
                </div>
                <div className="action-item__controls">
                  <span className="badge badge-warning">{action.status}</span>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
