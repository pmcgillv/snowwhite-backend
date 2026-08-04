import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useFetch } from '../hooks/useFetch'
import { LoadingState, ErrorState } from '../components/LoadingState'
import type { ActionItem, DashboardSummary } from '../api/client'

function money(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

function moneyExact(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(n)
}

function longDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(iso))
}

function shortDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso))
}

interface DashExtras extends DashboardSummary {
  yearsToPayOff?: number
  interestSavedActual?: number
  interestRemaining?: number
  principalPaid?: number
  principalRemaining?: number
  nextDebtTransfer?: { date: string; amount: number; actionId: string } | null
}

export default function PayoffMetrics() {
  const location = useLocation()
  const dash = useFetch<DashExtras>('/api/dashboard')
  const actionsRes = useFetch<{ actions: ActionItem[] }>('/api/actions')

  useEffect(() => {
    const hash = location.hash.replace('#', '')
    if (!hash) return
    const el = document.getElementById(hash)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('payoff-card--highlight')
      const t = window.setTimeout(() => el.classList.remove('payoff-card--highlight'), 1600)
      return () => window.clearTimeout(t)
    }
  }, [location.hash, dash.data])

  if (dash.loading) return <LoadingState text="Loading payoff metrics…" />
  if (dash.error || !dash.data) {
    return <ErrorState message={dash.error ?? 'No data'} onRetry={dash.refetch} />
  }

  const d = dash.data
  const years =
    d.yearsToPayOff ??
    Math.max(0, (new Date(d.debtFreeDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 365.25))
  const interestActual = d.interestSavedActual ?? 0
  const interestPotential = d.interestSavedProjected
  const interestRemaining = d.interestRemaining ?? Math.round(d.totalDebt * 0.18)
  const principalPaid = d.principalPaid ?? Math.round(d.totalDebt * 0.08)
  const principalRemaining = d.principalRemaining ?? d.totalDebt
  const next = d.nextDebtTransfer
  const pendingActions = (actionsRes.data?.actions ?? [])
    .filter((a) => a.status === 'pending')
    .slice(0, 5)

  const metrics = [
    {
      id: 'years',
      label: 'Years to Pay Off',
      value: `${years.toFixed(1)} yrs`,
      detail: `Projected finish ${longDate(d.debtFreeDate)}`,
    },
    {
      id: 'date',
      label: 'Payoff Date',
      value: shortDate(d.debtFreeDate),
      detail: 'Debt-free date if you follow the Action Plan',
    },
    {
      id: 'interest-saved',
      label: 'Interest Saved',
      value: money(interestPotential),
      detail: `Potential ${moneyExact(interestPotential)} · Actual ${moneyExact(interestActual)}`,
    },
    {
      id: 'interest-remaining',
      label: 'Interest Remaining',
      value: money(interestRemaining),
      detail: 'Estimated interest still owed on current schedule',
    },
    {
      id: 'principal-paid',
      label: 'Principal Paid',
      value: money(principalPaid),
      detail: 'Estimated principal reduction to date',
    },
    {
      id: 'principal-remaining',
      label: 'Principal Remaining',
      value: money(principalRemaining),
      detail: `Total debt balance ${moneyExact(d.totalDebt)}`,
    },
    {
      id: 'discretionary',
      label: 'Discretionary Income',
      value: money(d.discretionaryIncome),
      detail: `Monthly income ${money(d.monthlyIncome)} − expenses ${money(d.monthlyExpenses)}`,
    },
    {
      id: 'next-transfer',
      label: 'Next Debt Transfer',
      value: next ? money(next.amount) : '—',
      detail: next
        ? `Suggested ${longDate(next.date)} · Action ${next.actionId.slice(0, 8)}`
        : 'No pending debt transfer right now',
    },
  ]

  return (
    <div className="app-page page-enter" role="main" aria-labelledby="payoff-title">
      <header className="app-page__header">
        <h1 className="app-page__title" id="payoff-title">
          Payoff Metrics
        </h1>
        <p className="app-page__subtitle">
          Full Money Max–style snapshot: dates, interest, principal, and the next transfer.
          KPI tiles at the top jump here.
        </p>
      </header>

      <div className="payoff-grid" role="list" aria-label="Payoff metrics">
        {metrics.map((m) => (
          <article key={m.id} className="payoff-card" id={`metric-${m.id}`} role="listitem">
            <div className="payoff-card__label">{m.label}</div>
            <div className="payoff-card__value display">{m.value}</div>
            <div className="payoff-card__detail">{m.detail}</div>
          </article>
        ))}
      </div>

      <section className="payoff-section" aria-labelledby="interest-breakdown-title">
        <h2 className="section-header__title" id="interest-breakdown-title">
          Interest Saved Breakdown
        </h2>
        <div className="payoff-interest">
          <div className="payoff-interest__row">
            <span>Potential (vs minimum-only path)</span>
            <strong>{moneyExact(interestPotential)}</strong>
          </div>
          <div className="payoff-interest__row">
            <span>Actual (recorded so far)</span>
            <strong>{moneyExact(interestActual)}</strong>
          </div>
          <div className="payoff-interest__bar">
            <div
              className="payoff-interest__fill"
              style={{
                width: `${Math.min(
                  100,
                  interestPotential > 0 ? (interestActual / interestPotential) * 100 : 0,
                )}%`,
              }}
            />
          </div>
          <p className="payoff-interest__note">
            Actual stays at $0 until you Mark Executed on Action Plan items after paying at the bank.
          </p>
        </div>
      </section>

      <section className="payoff-section" aria-labelledby="next-moves-title">
        <div className="section-header">
          <h2 className="section-header__title" id="next-moves-title">
            Upcoming Debt Moves
          </h2>
          <Link to="/app/actions" className="section-header__action">
            Open Action Plan →
          </Link>
        </div>
        {pendingActions.length === 0 ? (
          <p className="app-page__subtitle">No pending actions.</p>
        ) : (
          <div className="payoff-moves">
            {pendingActions.map((a) => (
              <article key={a.id} className="payoff-move">
                <div>
                  <div className="payoff-move__date">{shortDate(a.suggestedDate)}</div>
                  <div className="payoff-move__reason">{a.reason}</div>
                </div>
                <div className="payoff-move__amount">{moneyExact(a.amount)}</div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
