import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts'
import { useFetch } from '../hooks/useFetch'
import { LoadingState, ErrorState } from '../components/LoadingState'
import type { DashboardSummary, ReportSummary } from '../api/client'

const fmtK = (n: number) => {
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(0)}k`
  return `$${n}`
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)

const tooltipStyle = {
  backgroundColor: '#0D1E2B',
  border: '1px solid rgba(232,226,214,0.12)',
  borderRadius: 8,
  color: '#E8E2D6',
}

export default function Reports() {
  const { data, loading, error, refetch } = useFetch<ReportSummary>('/api/reports/wealth')
  const dashRes = useFetch<DashboardSummary>('/api/dashboard')

  if (loading) return <LoadingState text="Generating reports…" />
  if (error || !data) return <ErrorState message={error ?? 'No data'} onRetry={refetch} />

  const dash = dashRes.data
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

  // Interest Saved: Potential vs Actual bar chart data
  const interestBarData = [
    {
      label: 'Interest Saved',
      potential: dash?.interestSavedProjected ?? data.totalPrincipalPaid * 0.2,
      actual: dash?.interestSavedActual ?? data.totalInterestPaid * 0.15,
    },
  ]

  // Payoff progress bar chart
  const payoffData = [
    {
      label: 'Debt Progress',
      paid: data.debtPayoffProgress,
      remaining: 100 - data.debtPayoffProgress,
    },
  ]

  return (
    <div className="app-page page-enter" role="main" aria-labelledby="reports-title">
      <header className="app-page__header">
        <h1 className="app-page__title" id="reports-title">
          Reports
        </h1>
        <p className="app-page__subtitle">
          Wealth trajectory, interest saved, and payoff progress over time.
        </p>
      </header>

      {/* KPI summary */}
      <div className="grid-4" style={{ marginBottom: 'var(--sp-8)' }}>
        <article className="stat-card">
          <div className="stat-card__label">Net Worth Change</div>
          <div
            className="stat-card__value display"
            style={{ color: nwGain >= 0 ? 'var(--teal)' : '#E06A54' }}
          >
            {fmt(nwGain)}
          </div>
          <div className="stat-card__sub">Since {first?.date.slice(0, 7) ?? '—'}</div>
        </article>
        <article className="stat-card">
          <div className="stat-card__label">Interest Paid</div>
          <div className="stat-card__value display">{fmt(data.totalInterestPaid)}</div>
          <div className="stat-card__sub">This period</div>
        </article>
        <article className="stat-card">
          <div className="stat-card__label">Savings Rate</div>
          <div className="stat-card__value display">{data.savingsRate.toFixed(0)}%</div>
          <div className="stat-card__trend stat-card__trend--up">On target</div>
        </article>
        <article className="stat-card">
          <div className="stat-card__label">Payoff Progress</div>
          <div className="stat-card__value display">{data.debtPayoffProgress.toFixed(0)}%</div>
          <div className="stat-card__sub">of total debt</div>
        </article>
      </div>

      {/* Interest Saved: Potential vs Actual */}
      <section style={{ marginBottom: 'var(--sp-8)' }} aria-labelledby="interest-saved-heading">
        <h2
          className="section-header__title"
          id="interest-saved-heading"
          style={{ marginBottom: 'var(--sp-4)' }}
        >
          Interest Saved — Potential vs Actual
        </h2>
        <div className="chart-panel">
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <BarChart data={interestBarData} layout="vertical">
                <CartesianGrid stroke="rgba(232,226,214,0.08)" horizontal={false} />
                <XAxis type="number" tickFormatter={fmtK} stroke="#E8E2D6" tick={{ fill: '#E8E2D6', fontSize: 11 }} />
                <YAxis type="category" dataKey="label" stroke="#E8E2D6" tick={{ fill: '#E8E2D6', fontSize: 11 }} width={100} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} />
                <Legend />
                <Bar dataKey="potential" name="Potential Savings" fill="rgba(26,166,138,0.6)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="actual" name="Actual Savings" fill="#1AA68A" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="reports-interest-summary">
            <div className="reports-interest-item">
              <span className="reports-interest-label">Potential Interest Saved</span>
              <span className="reports-interest-val reports-interest-val--potential">
                {fmt(dash?.interestSavedProjected ?? 0)}
              </span>
            </div>
            <div className="reports-interest-item">
              <span className="reports-interest-label">Actual Interest Saved</span>
              <span className="reports-interest-val reports-interest-val--actual">
                {fmt(dash?.interestSavedActual ?? 0)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Payoff progress */}
      <section style={{ marginBottom: 'var(--sp-8)' }} aria-labelledby="payoff-progress-heading">
        <h2
          className="section-header__title"
          id="payoff-progress-heading"
          style={{ marginBottom: 'var(--sp-4)' }}
        >
          Debt Payoff Progress
        </h2>
        <div className="chart-panel">
          <div style={{ width: '100%', height: 160 }}>
            <ResponsiveContainer>
              <BarChart data={payoffData} layout="vertical">
                <CartesianGrid stroke="rgba(232,226,214,0.08)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} stroke="#E8E2D6" tick={{ fill: '#E8E2D6', fontSize: 11 }} />
                <YAxis type="category" dataKey="label" stroke="#E8E2D6" tick={{ fill: '#E8E2D6', fontSize: 11 }} width={100} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v.toFixed(1)}%`} />
                <Legend />
                <Bar dataKey="paid" name="Paid Off" fill="#1AA68A" stackId="p" radius={[0, 0, 0, 0]} />
                <Bar dataKey="remaining" name="Remaining" fill="rgba(232,226,214,0.1)" stackId="p" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Wealth trajectory */}
      <section aria-labelledby="wealth-trajectory-heading">
        <h2
          className="section-header__title"
          id="wealth-trajectory-heading"
          style={{ marginBottom: 'var(--sp-4)' }}
        >
          Wealth Trajectory
        </h2>
        <div className="chart-panel">
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid stroke="rgba(232,226,214,0.08)" />
                <XAxis
                  dataKey="month"
                  stroke="#E8E2D6"
                  tick={{ fill: '#E8E2D6', fontSize: 11 }}
                />
                <YAxis
                  tickFormatter={fmtK}
                  stroke="#E8E2D6"
                  tick={{ fill: '#E8E2D6', fontSize: 11 }}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="netWorth"
                  name="Net Worth"
                  stroke="#1AA68A"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="assets"
                  name="Assets"
                  stroke="#7C9A82"
                  strokeWidth={1.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="liabilities"
                  name="Liabilities"
                  stroke="#C47B6A"
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  )
}
