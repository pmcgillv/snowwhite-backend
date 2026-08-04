import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { useFetch } from '../hooks/useFetch'
import { LoadingState, ErrorState } from '../components/LoadingState'
import type { CashflowPoint } from '../api/client'

function fmtK(n: number) {
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(1)}k`
  return `$${n}`
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

export default function Cashflow() {
  const { data, loading, error, refetch } = useFetch<{
    range: string
    points: CashflowPoint[]
  }>('/api/cashflow?range=90d')

  if (loading) return <LoadingState text="Loading cashflow data…" />
  if (error || !data) return <ErrorState message={error ?? 'No data'} onRetry={refetch} />

  const points = data.points
  const totalIn = points.reduce((s, d) => s + d.inflow, 0)
  const totalOut = points.reduce((s, d) => s + d.outflow, 0)
  const chartData = points
    .filter((_, i) => i % 3 === 0)
    .map((p) => ({
      day: p.date.slice(5),
      inflow: p.inflow,
      outflow: p.outflow,
      balance: p.balance,
    }))

  const tooltipStyle = {
    backgroundColor: '#0D1E2B',
    border: '1px solid rgba(232,226,214,0.12)',
    borderRadius: 8,
    color: '#E8E2D6',
  }

  return (
    <div className="app-page page-enter" role="main" aria-labelledby="cashflow-title">
      <header className="app-page__header">
        <h1 className="app-page__title" id="cashflow-title">Cashflow</h1>
        <p className="app-page__subtitle">90-day inflow, outflow, and running balance.</p>
      </header>

      <div className="grid-3" style={{ marginBottom: 'var(--sp-8)' }}>
        <article className="stat-card">
          <div className="stat-card__label">Inflow</div>
          <div className="stat-card__value display">{fmt(totalIn)}</div>
        </article>
        <article className="stat-card">
          <div className="stat-card__label">Outflow</div>
          <div className="stat-card__value display">{fmt(totalOut)}</div>
        </article>
        <article className="stat-card">
          <div className="stat-card__label">Net</div>
          <div className="stat-card__value display">{fmt(totalIn - totalOut)}</div>
        </article>
      </div>

      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          <AreaChart data={chartData}>
            <CartesianGrid stroke="rgba(232,226,214,0.08)" />
            <XAxis dataKey="day" stroke="#E8E2D6" tick={{ fill: '#E8E2D6', fontSize: 11 }} />
            <YAxis tickFormatter={fmtK} stroke="#E8E2D6" tick={{ fill: '#E8E2D6', fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            <Area type="monotone" dataKey="balance" stroke="#1AA68A" fill="rgba(26,166,138,0.2)" />
            <Area type="monotone" dataKey="inflow" stroke="#7C9A82" fill="transparent" />
            <Area type="monotone" dataKey="outflow" stroke="#C47B6A" fill="transparent" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
