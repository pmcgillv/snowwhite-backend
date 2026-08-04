import { useState, useCallback } from 'react'
import { useFetch } from '../hooks/useFetch'
import { LoadingState, ErrorState, EmptyState } from '../components/LoadingState'
import { IconShield } from '../components/Icons'
import { api } from '../api/client'
import type { Action } from '../api/client'

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

type Filter = 'all' | 'pending' | 'approved' | 'executed' | 'dismissed'

export default function Actions() {
  const { data: actions, loading, error, refetch } = useFetch<Action[]>('/api/actions')
  const [filter, setFilter] = useState<Filter>('all')
  const [busy, setBusy] = useState<Record<string, boolean>>({})

  const mutate = useCallback(
    async (id: string, status: Action['status']) => {
      setBusy(p => ({ ...p, [id]: true }))
      try {
        await api.patch(`/api/actions/${id}`, { status })
        await refetch()
      } catch {
        // silently refetch to sync
        await refetch()
      } finally {
        setBusy(p => ({ ...p, [id]: false }))
      }
    },
    [refetch],
  )

  if (loading) return <LoadingState text="Loading action plan…" />
  if (error || !actions) return <ErrorState message={error ?? 'No data'} onRetry={refetch} />

  const filtered = actions.filter(a => filter === 'all' || a.status === filter)

  const counts = {
    pending:   actions.filter(a => a.status === 'pending').length,
    approved:  actions.filter(a => a.status === 'approved').length,
    executed:  actions.filter(a => a.status === 'executed').length,
    dismissed: actions.filter(a => a.status === 'dismissed').length,
  }

  const FILTERS: { key: Filter; label: string; count?: number }[] = [
    { key: 'all',       label: 'All',       count: actions.length },
    { key: 'pending',   label: 'Pending',   count: counts.pending   },
    { key: 'approved',  label: 'Approved',  count: counts.approved  },
    { key: 'executed',  label: 'Executed',  count: counts.executed  },
    { key: 'dismissed', label: 'Dismissed', count: counts.dismissed },
  ]

  return (
    <div className="app-page page-enter" role="main" aria-labelledby="actions-title">
      <header className="app-page__header">
        <h1 className="app-page__title" id="actions-title">Action Plan</h1>
        <p className="app-page__subtitle">
          Your personalised financial playbook. Review and approve each step.
        </p>
      </header>

      {/* Safe-money notice */}
      <div className="readonly-notice" role="note" aria-label="Safety notice">
        <span className="readonly-notice__icon" aria-hidden="true">
          <IconShield size={16} />
        </span>
        <div className="readonly-notice__text">
          <strong>Your money never moves automatically.</strong> Ledgerline recommends
          actions and shows you exactly what to do. Every action below must be
          <strong> explicitly approved by you</strong> before anything happens. You can
          dismiss any action at any time.
        </div>
      </div>

      {/* Filter tabs */}
      <div role="tablist" aria-label="Filter actions" style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-6)', flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            role="tab"
            aria-selected={filter === f.key}
            aria-label={f.label}
            className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            {f.count != null && f.count > 0 && (
              <span style={{
                marginLeft: 'var(--sp-1)',
                background: filter === f.key ? 'rgba(6,16,24,0.25)' : 'var(--sand-10)',
                borderRadius: '10px',
                padding: '1px 6px',
                fontSize: 'var(--text-xs)',
              }}>
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
          {filtered.map((action, i) => (
            <ActionItem
              key={action.id}
              action={action}
              index={i}
              busy={!!busy[action.id]}
              onApprove={() => mutate(action.id, 'approved')}
              onExecute={() => mutate(action.id, 'executed')}
              onDismiss={() => mutate(action.id, 'dismissed')}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface ActionItemProps {
  action: Action
  index: number
  busy: boolean
  onApprove: () => void
  onExecute: () => void
  onDismiss: () => void
}

function ActionItem({ action, index, busy, onApprove, onExecute, onDismiss }: ActionItemProps) {
  return (
    <article
      className="action-item stagger-item"
      style={{ animationDelay: `${index * 60}ms` }}
      role="listitem"
      aria-label={`${action.title} — ${action.status}`}
      aria-busy={busy}
    >
      <div className="action-item__header">
        <div
          className={`action-item__priority action-item__priority--${action.priority}`}
          aria-label={`${action.priority} priority`}
        />
        <div className="action-item__body">
          <div className="action-item__title">{action.title}</div>
          <div className="action-item__desc">{action.description}</div>
          <div className="action-item__meta">
            <span className={`badge badge-${action.status === 'pending' ? 'warning' : action.status === 'executed' ? 'teal' : 'muted'}`}>
              {action.status}
            </span>
            <span aria-label={`Action type: ${action.type}`}>{action.type}</span>
            {action.dueDate && (
              <span aria-label={`Due: ${action.dueDate}`}>Due {action.dueDate}</span>
            )}
          </div>
        </div>
        <div className="action-item__amount" aria-label={`Amount: ${fmt(action.amount)}`}>
          {fmt(action.amount)}
        </div>
      </div>

      <div className="action-item__controls">
        {action.status === 'pending' && (
          <>
            <button
              className="btn btn-primary btn-sm"
              onClick={onApprove}
              disabled={busy}
              aria-label={`Approve action: ${action.title}`}
            >
              Approve
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={onDismiss}
              disabled={busy}
              aria-label={`Dismiss action: ${action.title}`}
            >
              Dismiss
            </button>
          </>
        )}
        {action.status === 'approved' && (
          <>
            <button
              className="btn btn-primary btn-sm"
              onClick={onExecute}
              disabled={busy}
              aria-label={`Mark executed: ${action.title}`}
            >
              Mark Executed
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={onDismiss}
              disabled={busy}
              aria-label={`Dismiss action: ${action.title}`}
            >
              Dismiss
            </button>
          </>
        )}
        {action.status === 'executed' && (
          <span className="badge badge-teal">Completed</span>
        )}
        {action.status === 'dismissed' && (
          <span className="badge badge-muted">Dismissed</span>
        )}
      </div>
    </article>
  )
}
