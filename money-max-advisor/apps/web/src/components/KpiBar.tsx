import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useFetch } from '../hooks/useFetch'
import { IconChevronDown } from './Icons'
import type { DashboardSummary, ActionItem } from '../api/client'

type KpiMetric =
  | 'payoffDate'
  | 'yearsToPayoff'
  | 'interestSaved'
  | 'interestRemaining'
  | 'principalPaid'
  | 'principalRemaining'
  | 'discretionary'
  | 'nextDebtTransfer'

const METRIC_LABELS: Record<KpiMetric, string> = {
  payoffDate: 'Payoff Date',
  yearsToPayoff: 'Years to Pay Off',
  interestSaved: 'Interest Saved',
  interestRemaining: 'Interest Remaining',
  principalPaid: 'Principal Paid',
  principalRemaining: 'Principal Remaining',
  discretionary: 'Discretionary',
  nextDebtTransfer: 'Next Debt Transfer',
}

const METRIC_ANCHORS: Record<KpiMetric, string> = {
  payoffDate: 'date',
  yearsToPayoff: 'years',
  interestSaved: 'interest-saved',
  interestRemaining: 'interest-remaining',
  principalPaid: 'principal-paid',
  principalRemaining: 'principal-remaining',
  discretionary: 'discretionary',
  nextDebtTransfer: 'next-transfer',
}

const ALL_METRICS: KpiMetric[] = [
  'payoffDate',
  'yearsToPayoff',
  'interestSaved',
  'interestRemaining',
  'principalPaid',
  'principalRemaining',
  'discretionary',
  'nextDebtTransfer',
]

const DEFAULT_TILES: KpiMetric[] = [
  'yearsToPayoff',
  'payoffDate',
  'interestSaved',
  'nextDebtTransfer',
  'discretionary',
]

interface DashExtras extends DashboardSummary {
  yearsToPayOff?: number
  interestSavedActual?: number
  interestRemaining?: number
  principalPaid?: number
  principalRemaining?: number
  nextDebtTransfer?: { date: string; amount: number; actionId: string } | null
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)

function computeValue(
  metric: KpiMetric,
  dash: DashExtras,
  nextAction: ActionItem | null,
): string {
  switch (metric) {
    case 'payoffDate':
      return new Date(dash.debtFreeDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      })
    case 'yearsToPayoff': {
      if (dash.yearsToPayOff != null) return `${dash.yearsToPayOff.toFixed(1)} yrs`
      const ms = new Date(dash.debtFreeDate).getTime() - Date.now()
      const years = ms / (1000 * 60 * 60 * 24 * 365.25)
      return `${Math.max(0, years).toFixed(1)} yrs`
    }
    case 'interestSaved':
      return fmt(dash.interestSavedProjected)
    case 'interestRemaining':
      return fmt(dash.interestRemaining ?? dash.totalDebt * 0.18)
    case 'principalPaid':
      return fmt(dash.principalPaid ?? dash.totalDebt * 0.08)
    case 'principalRemaining':
      return fmt(dash.principalRemaining ?? dash.totalDebt)
    case 'discretionary':
      return fmt(dash.discretionaryIncome)
    case 'nextDebtTransfer': {
      const next = dash.nextDebtTransfer
      if (next) {
        const date = new Date(next.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
        return `${fmt(next.amount)} · ${date}`
      }
      if (!nextAction) return '—'
      const date = new Date(nextAction.suggestedDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
      return `${fmt(nextAction.amount)} · ${date}`
    }
    default: {
      const _exhaustive: never = metric
      return String(_exhaustive)
    }
  }
}

interface KpiTileProps {
  metric: KpiMetric
  dash: DashExtras
  nextAction: ActionItem | null
  onSwitch: (m: KpiMetric) => void
}

function KpiTile({ metric, dash, nextAction, onSwitch }: KpiTileProps) {
  const [open, setOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const value = computeValue(metric, dash, nextAction)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  return (
    <div className="kpi-tile" ref={dropRef}>
      <button
        className="kpi-tile__label"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Switch metric shown on this tile"
      >
        {METRIC_LABELS[metric]}
        <IconChevronDown size={12} />
      </button>
      {open && (
        <div className="kpi-tile__dropdown" role="listbox">
          {ALL_METRICS.map((m) => (
            <button
              key={m}
              role="option"
              aria-selected={m === metric}
              className={`kpi-tile__option${m === metric ? ' active' : ''}`}
              onClick={() => {
                onSwitch(m)
                setOpen(false)
              }}
            >
              {METRIC_LABELS[m]}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        className="kpi-tile__value kpi-tile__value--link"
        onClick={() => navigate(`/app/payoff#metric-${METRIC_ANCHORS[metric]}`)}
        title={`Open full ${METRIC_LABELS[metric]} details`}
      >
        {value}
      </button>
    </div>
  )
}

export function KpiBar() {
  const [tiles, setTiles] = useState<KpiMetric[]>(DEFAULT_TILES)
  const dash = useFetch<DashExtras>('/api/dashboard')
  const actionsRes = useFetch<{ actions: ActionItem[] }>('/api/actions')

  const nextAction =
    actionsRes.data?.actions.find(
      (a) => a.status === 'pending' && (a.type === 'debt_payment' || a.type === 'transfer'),
    ) ?? null

  if (dash.loading || !dash.data) {
    return (
      <div className="kpi-bar kpi-bar--loading" role="status" aria-label="Key metrics">
        {DEFAULT_TILES.map((_, i) => (
          <div key={i} className="kpi-tile kpi-tile--skeleton" />
        ))}
      </div>
    )
  }

  return (
    <div className="kpi-bar" role="toolbar" aria-label="Key performance metrics">
      {tiles.map((metric, i) => (
        <KpiTile
          key={`${i}-${metric}`}
          metric={metric}
          dash={dash.data!}
          nextAction={nextAction}
          onSwitch={(m) => setTiles((prev) => prev.map((t, j) => (j === i ? m : t)))}
        />
      ))}
      <Link to="/app/payoff" className="kpi-bar__all">
        View all metrics →
      </Link>
    </div>
  )
}
