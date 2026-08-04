import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useFetch } from '../hooks/useFetch'
import { LoadingState, ErrorState } from '../components/LoadingState'
import { IconShield } from '../components/Icons'
import { api } from '../api/client'
import type { Account, ActionItem, ActionType } from '../api/client'

const money = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(n)

const moneyWhole = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)

function longDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(iso))
}

function actionTitle(type: ActionType): string {
  switch (type) {
    case 'debt_payment':
      return 'Debt payment'
    case 'sweep':
      return 'Cash sweep'
    case 'reserve':
      return 'Emergency reserve'
    case 'transfer':
      return 'Transfer'
    default: {
      const _exhaustive: never = type
      return String(_exhaustive)
    }
  }
}

export default function ActionPay() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const actionRes = useFetch<{ action: ActionItem }>(`/api/actions/${id}`)
  const accountsRes = useFetch<{ accounts: Account[] }>('/api/accounts')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [stepDone, setStepDone] = useState<Record<number, boolean>>({})
  const [error, setError] = useState<string | null>(null)

  const action = actionRes.data?.action
  const accounts = accountsRes.data?.accounts ?? []

  const from = useMemo(
    () => accounts.find((a) => a.id === action?.fromAccountId),
    [accounts, action?.fromAccountId],
  )
  const to = useMemo(
    () => accounts.find((a) => a.id === action?.toAccountId),
    [accounts, action?.toAccountId],
  )

  async function copyAmount() {
    if (!action) return
    try {
      await navigator.clipboard.writeText(action.amount.toFixed(2))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  async function ensureApproved() {
    if (!action || action.status === 'approved' || action.status === 'executed') return
    await api.post(`/api/actions/${action.id}/approve`)
  }

  async function markExecuted() {
    if (!action) return
    setBusy(true)
    setError(null)
    try {
      await ensureApproved()
      await api.post(`/api/actions/${action.id}/execute`)
      navigate('/app/actions', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not mark executed')
    } finally {
      setBusy(false)
    }
  }

  if (actionRes.loading) return <LoadingState text="Loading payment details…" />
  if (actionRes.error || !action) {
    return (
      <ErrorState
        message={actionRes.error ?? 'Action not found'}
        onRetry={actionRes.refetch}
      />
    )
  }

  const steps = [
    {
      title: `Open ${from?.institution ?? 'your bank'}`,
      detail: `Sign in to ${from?.name ?? 'the source account'} (bill pay, transfer, or card payment).`,
    },
    {
      title: `Send ${money(action.amount)}`,
      detail: `Pay toward ${to?.name ?? 'the destination'}${
        to?.institution ? ` at ${to.institution}` : ''
      }. Suggested date: ${longDate(action.suggestedDate)}.`,
    },
    {
      title: 'Confirm it posted',
      detail:
        'Wait until your bank shows the payment pending or completed, then mark it executed here.',
    },
  ]

  return (
    <div className="app-page page-enter" role="main" aria-labelledby="pay-title">
      <header className="app-page__header">
        <p className="app-page__eyebrow">
          <Link to="/app/actions">← Action Plan</Link>
        </p>
        <h1 className="app-page__title" id="pay-title">
          Payment
        </h1>
        <p className="app-page__subtitle">
          {actionTitle(action.type)} — pay this yourself at the bank. Ledgerline only tracks
          status.
        </p>
      </header>

      <div className="readonly-notice" role="note">
        <span className="readonly-notice__icon" aria-hidden="true">
          <IconShield size={16} />
        </span>
        <p className="readonly-notice__text">
          <strong>Read-only money movement.</strong> This page does not connect to your bank or
          send funds. Use it as a checklist while you pay manually.
        </p>
      </div>

      <section className="pay-hero" aria-label="Payment amount">
        <div className="pay-hero__label">Amount to pay</div>
        <div className="pay-hero__amount display">{money(action.amount)}</div>
        <div className="pay-hero__actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => void copyAmount()}>
            {copied ? 'Copied' : 'Copy amount'}
          </button>
          <span className={`badge badge-${action.status === 'executed' ? 'teal' : action.status === 'approved' ? 'info' : 'warning'}`}>
            {action.status}
          </span>
        </div>
      </section>

      <div className="pay-grid">
        <article className="pay-card">
          <div className="pay-card__label">From</div>
          <div className="pay-card__value">{from?.name ?? action.fromAccountId}</div>
          <div className="pay-card__meta">
            {from?.institution ?? 'Account'}
            {from ? ` · balance ${moneyWhole(from.balance)}` : ''}
          </div>
        </article>
        <article className="pay-card">
          <div className="pay-card__label">To</div>
          <div className="pay-card__value">{to?.name ?? action.toAccountId}</div>
          <div className="pay-card__meta">
            {to?.institution ?? 'Account'}
            {to?.interestRateAPR ? ` · ${to.interestRateAPR.toFixed(2)}% APR` : ''}
            {to?.interestOnlyPeriod?.active ? ' · interest-only' : ''}
          </div>
        </article>
        <article className="pay-card">
          <div className="pay-card__label">Suggested date</div>
          <div className="pay-card__value pay-card__value--sm">{longDate(action.suggestedDate)}</div>
          <div className="pay-card__meta">
            Interest impact {action.interestImpact > 0 ? `−${moneyWhole(action.interestImpact)}` : '—'}
          </div>
        </article>
      </div>

      <section className="pay-section" aria-labelledby="why-title">
        <h2 className="section-header__title" id="why-title">
          Why this payment
        </h2>
        <p className="pay-reason">{action.reason}</p>
      </section>

      <section className="pay-section" aria-labelledby="steps-title">
        <h2 className="section-header__title" id="steps-title">
          Pay at your bank
        </h2>
        <ol className="pay-steps">
          {steps.map((step, i) => (
            <li key={step.title} className="pay-step">
              <label className="pay-step__check">
                <input
                  type="checkbox"
                  checked={!!stepDone[i]}
                  onChange={(e) =>
                    setStepDone((prev) => ({ ...prev, [i]: e.target.checked }))
                  }
                />
                <span>
                  <strong>{step.title}</strong>
                  <span className="pay-step__detail">{step.detail}</span>
                </span>
              </label>
            </li>
          ))}
        </ol>
      </section>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="pay-footer">
        {action.status !== 'executed' ? (
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy}
            onClick={() => void markExecuted()}
          >
            {busy ? 'Saving…' : "I've paid this — Mark Executed"}
          </button>
        ) : (
          <span className="badge badge-teal">Already completed</span>
        )}
        <Link to="/app/actions" className="btn btn-ghost">
          Back to Action Plan
        </Link>
      </div>
    </div>
  )
}
