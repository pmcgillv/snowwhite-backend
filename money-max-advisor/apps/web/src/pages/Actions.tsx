import { useState, useCallback } from 'react'
import { useFetch } from '../hooks/useFetch'
import { LoadingState, ErrorState, EmptyState } from '../components/LoadingState'
import { IconShield } from '../components/Icons'
import { api } from '../api/client'
import type { ActionItem, ActionStatus } from '../api/client'

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
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

type Filter = 'all' | ActionStatus

export default function Actions() {
  const { data, loading, error, refetch } = useFetch<{ actions: ActionItem[] }>('/api/actions')
  const [filter, setFilter] = useState<Filter>('all')
  const [busy, setBusy] = useState<Record<string, boolean>>({})

  const mutate = useCallback(
    async (id: string, next: ActionStatus) => {
      setBusy((p) => ({ ...p, [id]: true }))
      try {
        const path =
          next === 'approved'
            ? `/api/actions/${id}/approve`
            : next === 'executed'
              ? `/api/actions/${id}/execute`
              : `/api/actions/${id}/dismiss`
        await api.post(path)
        await refetch()
      } catch {
        await refetch()
      } finally {
        setBusy((p) => ({ ...p, [id]: false }))
      }
    },
    [refetch],
  )

  if (loading) return <LoadingState text="Loading action plan…" />
  if (error || !data) return <ErrorState message={error ?? 'No data'} onRetry={refetch} />

  const actions = data.actions
  const filtered = actions.filter((a) => filter === 'all' || a.status === filter)

  const counts = {
    pending: actions.filter((a) => a.status === 'pending').length,
    approved: actions.filter((a) => a.status === 'approved').length,
    executed: actions.filter((a) => a.status === 'executed').length,
    dismissed: actions.filter((a) => a.status === 'dismissed').length,
  }

  const FILTERS: { key: Filter; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: actions.length },
    { key: 'pending', label: 'Pending', count: counts.pending },
    { key: 'approved', label: 'Approved', count: counts.approved },
    { key: 'executed', label: 'Executed', count: counts.executed },
    { key: 'dismissed', label: 'Dismissed', count: counts.dismissed },
  ]

  return (
    <div className="app-page page-enter" role="main" aria-labelledby="actions-title">
      <header className="app-page__header">
        <h1 className="app-page__title" id="actions-title">Action Plan</h1>
        <p className="app-page__subtitle">
          Optimal payment timing to cut interest volume — not just due dates.
        </p>
      </header>

      <div className="readonly-notice" role="note" aria-label="Safety notice">
        <span className="readonly-notice__icon" aria-hidden="true">
          <IconShield size={16} />
        </span>
        <div className="readonly-notice__text">
          <strong>Your money never moves automatically.</strong> Ledgerline recommends
          actions only. Approve means you agree with the plan; Mark Executed means you
          already paid it yourself at the bank.
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Filter actions"
        style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-6)', flexWrap: 'wrap' }}
      >
        {FILTERS.map((f) => (
          <button
            key={f.key}
            role="tab"
            aria-selected={filter === f.key}
            className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            {f.count != null && f.count > 0 && (
              <span
                style={{
                  marginLeft: 'var(--sp-1)',
                  background: filter === f.key ? 'rgba(6,16,24,0.25)' : 'var(--sand-10)',
                  borderRadius: '10px',
                  padding: '1px 6px',
                  fontSize: 'var(--text-xs)',
                }}
              >
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState text={`No ${filter === 'all' ? '' : filter} actions.`} />
      ) : (
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}
          role="list"
          aria-label="Action items"
        >
          {filtered.map((action, i) => {
            const band = priorityBand(action.priority)
            const title = actionTitle(action)
            return (
              <article
                key={action.id}
                className="action-item stagger-item"
                style={{ animationDelay: `${i * 60}ms` }}
                role="listitem"
                aria-label={`${title} — ${action.status}`}
                aria-busy={!!busy[action.id]}
              >
                <div className="action-item__header">
                  <div
                    className={`action-item__priority action-item__priority--${band}`}
                    aria-label={`${band} priority`}
                  />
                  <div className="action-item__body">
                    <div className="action-item__title">{title}</div>
                    <div className="action-item__desc">{action.reason}</div>
                    <div className="action-item__meta">
                      <span
                        className={`badge badge-${
                          action.status === 'pending'
                            ? 'warning'
                            : action.status === 'executed'
                              ? 'teal'
                              : 'muted'
                        }`}
                      >
                        {action.status}
                      </span>
                      <span>{action.type}</span>
                      <span>Suggested {action.suggestedDate}</span>
                      <span>Interest impact {fmt(action.interestImpact)}</span>
                    </div>
                  </div>
                  <div className="action-item__amount">{fmt(action.amount)}</div>
                </div>

                <div className="action-item__controls">
                  {action.status === 'pending' && (
                    <>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => void mutate(action.id, 'approved')}
                        disabled={!!busy[action.id]}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => void mutate(action.id, 'dismissed')}
                        disabled={!!busy[action.id]}
                      >
                        Dismiss
                      </button>
                    </>
                  )}
                  {action.status === 'approved' && (
                    <>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => void mutate(action.id, 'executed')}
                        disabled={!!busy[action.id]}
                      >
                        Mark Executed
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => void mutate(action.id, 'dismissed')}
                        disabled={!!busy[action.id]}
                      >
                        Dismiss
                      </button>
                    </>
                  )}
                  {action.status === 'executed' && <span className="badge badge-teal">Completed</span>}
                  {action.status === 'dismissed' && <span className="badge badge-muted">Dismissed</span>}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
