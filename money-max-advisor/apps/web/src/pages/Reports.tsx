import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { useFetch } from '../hooks/useFetch'
import { LoadingState, ErrorState } from '../components/LoadingState'
import type { ReportSummary } from '../api/client'

function fmtK(n: number) {
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(0)}k`
  return `$${n}`
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

export default function Reports() {
  const { data, loading, error, refetch } = useFetch<ReportSummary>('/api/reports/wealth')

  if (loading) return <LoadingState text="Generating reports…" />
  if (error || !data) return <ErrorState message={error ?? 'No data'} onRetry={refetch} />

  const traj = data.wealthTrajectory
  const latest = traj[traj.length - 1]
  const first = traj[0]
  const nwGain = latest && first ? latest.netWorth - first.netWorth : 0

  const chartData = traj.map((s) => ({
    month: s.date.slice(0, 7),
    netWorth: s.netWorth,
    assets: s.assets,
    liabilities: s.liabilities,
  }))

  const tooltipStyle = {
    backgroundColor: '#0D1E2B',
    border: '1px solid rgba(232,226,214,0.12)',
    borderRadius: 8,
    color: '#E8E2D6',
  }

  return (
    <div className="app-page page-enter" role="main" aria-labelledby="reports-title">
      <header className="app-page__header">
        <h1 className="app-page__title" id="reports-title">Reports</h1>
        <p className="app-page__subtitle">Wealth trajectory and payoff progress.</p>
      </header>

      <div className="grid-4" style={{ marginBottom: 'var(--sp-8)' }}>
        <article className="stat-card">
          <div className="stat-card__label">Net worth change</div>
          <div className="stat-card__value display">{fmt(nwGain)}</div>
        </article>
        <article className="stat-card">
          <div className="stat-card__label">Interest paid</div>
          <div className="stat-card__value display">{fmt(data.totalInterestPaid)}</div>
        </article>
        <article className="stat-card">
          <div className="stat-card__label">Savings rate</div>
          <div className="stat-card__value display">{data.savingsRate.toFixed(0)}%</div>
        </article>
        <article className="stat-card">
          <div className="stat-card__label">Payoff progress</div>
          <div className="stat-card__value display">{data.debtPayoffProgress.toFixed(0)}%</div>
        </article>
      </div>

      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid stroke="rgba(232,226,214,0.08)" />
            <XAxis dataKey="month" stroke="#E8E2D6" tick={{ fill: '#E8E2D6', fontSize: 11 }} />
            <YAxis tickFormatter={fmtK} stroke="#E8E2D6" tick={{ fill: '#E8E2D6', fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="netWorth" stroke="#1AA68A" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="assets" stroke="#7C9A82" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="liabilities" stroke="#C47B6A" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
