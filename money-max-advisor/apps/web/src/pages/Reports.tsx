import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
} from 'recharts'
import { useFetch } from '../hooks/useFetch'
import { LoadingState, ErrorState } from '../components/LoadingState'
import type { WealthReport } from '../api/client'

function fmtK(n: number) {
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(0)}k`
  return `$${n}`
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export default function Reports() {
  const { data, loading, error, refetch } = useFetch<WealthReport[]>('/api/reports')

  if (loading) return <LoadingState text="Generating reports…" />
  if (error || !data) return <ErrorState message={error ?? 'No data'} onRetry={refetch} />

  const latest = data[data.length - 1]
  const first  = data[0]
  const nwGain = latest ? (latest.netWorth - (first?.netWorth ?? 0)) : 0
  const totalSaved = data.reduce((s, d) => s + d.interestSaved, 0)

  const tooltipStyle = {
    backgroundColor: '#0D1E2B',
    border: '1px solid rgba(232,226,214,0.12)',
    borderRadius: 8,
    color: '#E8E2D6',
    fontFamily: "'Manrope', sans-serif",
    fontSize: 13,
  }

  return (
    <div className="app-page page-enter" role="main" aria-labelledby="reports-title">
      <header className="app-page__header">
        <h1 className="app-page__title" id="reports-title">Reports</h1>
        <p className="app-page__subtitle">Wealth accumulation and interest savings over time.</p>
      </header>

      <div className="grid-3" style={{ marginBottom: 'var(--sp-8)' }}>
        <article className="stat-card">
          <div className="stat-card__label">Current Net Worth</div>
          <div className="stat-card__value display" style={{ color: (latest?.netWorth ?? 0) >= 0 ? 'var(--teal)' : '#E06A54' }}>
            {fmt(latest?.netWorth ?? 0)}
          </div>
          <div className={`stat-card__trend ${nwGain >= 0 ? 'stat-card__trend--up' : 'stat-card__trend--down'}`}>
            {nwGain >= 0 ? '+' : ''}{fmt(nwGain)} since start
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-card__label">Total Debt</div>
          <div className="stat-card__value display" style={{ color: '#E06A54' }}>
            {fmt(latest?.totalDebt ?? 0)}
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-card__label">Interest Saved (cumulative)</div>
          <div className="stat-card__value display" style={{ color: 'var(--teal)' }}>
            {fmt(totalSaved)}
          </div>
        </article>
      </div>

      {/* Net worth area */}
      <section className="chart-panel" aria-labelledby="nw-chart-title" style={{ marginBottom: 'var(--sp-6)' }}>
        <h2 className="chart-panel__title" id="nw-chart-title">Net Worth Over Time</h2>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#1AA68A" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#1AA68A" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="debtGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#C0503A" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#C0503A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(232,226,214,0.06)" />
            <XAxis dataKey="month" tick={{ fill: 'rgba(232,226,214,0.5)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtK} tick={{ fill: 'rgba(232,226,214,0.5)', fontSize: 12 }} axisLine={false} tickLine={false} width={56} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(val: number) => fmt(val)}
              labelStyle={{ color: '#E8E2D6', fontWeight: 600 }}
            />
            <Area type="monotone" dataKey="netWorth"  stroke="#1AA68A" fill="url(#nwGrad)"   strokeWidth={2} name="Net Worth" />
            <Area type="monotone" dataKey="totalDebt" stroke="#C0503A" fill="url(#debtGrad)" strokeWidth={2} name="Total Debt" />
          </AreaChart>
        </ResponsiveContainer>
      </section>

      {/* Interest saved line */}
      <section className="chart-panel" aria-labelledby="int-chart-title">
        <h2 className="chart-panel__title" id="int-chart-title">Cumulative Interest Saved</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(232,226,214,0.06)" />
            <XAxis dataKey="month" tick={{ fill: 'rgba(232,226,214,0.5)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtK} tick={{ fill: 'rgba(232,226,214,0.5)', fontSize: 12 }} axisLine={false} tickLine={false} width={56} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(val: number) => fmt(val)}
              labelStyle={{ color: '#E8E2D6', fontWeight: 600 }}
            />
            <Line type="monotone" dataKey="interestSaved" stroke="#D4A84B" strokeWidth={2} dot={false} name="Interest Saved" />
          </LineChart>
        </ResponsiveContainer>
      </section>
    </div>
  )
}
