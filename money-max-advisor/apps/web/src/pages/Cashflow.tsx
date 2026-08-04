import {
  ResponsiveContainer,
  AreaChart,
  Area,
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
import type { CashflowEntry } from '../api/client'

function fmtK(n: number) {
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(1)}k`
  return `$${n}`
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export default function Cashflow() {
  const { data, loading, error, refetch } = useFetch<CashflowEntry[]>('/api/cashflow')

  if (loading) return <LoadingState text="Loading cashflow data…" />
  if (error || !data) return <ErrorState message={error ?? 'No data'} onRetry={refetch} />

  const totalIncome   = data.reduce((s, d) => s + d.income, 0)
  const totalExpenses = data.reduce((s, d) => s + d.expenses, 0)
  const totalNet      = data.reduce((s, d) => s + d.net, 0)

  const tooltipStyle = {
    backgroundColor: '#0D1E2B',
    border: '1px solid rgba(232,226,214,0.12)',
    borderRadius: 8,
    color: '#E8E2D6',
    fontFamily: "'Manrope', sans-serif",
    fontSize: 13,
  }

  return (
    <div className="app-page page-enter" role="main" aria-labelledby="cashflow-title">
      <header className="app-page__header">
        <h1 className="app-page__title" id="cashflow-title">Cashflow</h1>
        <p className="app-page__subtitle">Monthly income, expenses, and net position.</p>
      </header>

      <div className="grid-3" style={{ marginBottom: 'var(--sp-8)' }}>
        <article className="stat-card">
          <div className="stat-card__label">Total Income (12 mo)</div>
          <div className="stat-card__value display">{fmt(totalIncome)}</div>
        </article>
        <article className="stat-card">
          <div className="stat-card__label">Total Expenses (12 mo)</div>
          <div className="stat-card__value display">{fmt(totalExpenses)}</div>
        </article>
        <article className="stat-card">
          <div className="stat-card__label">Net Position (12 mo)</div>
          <div className={`stat-card__value display ${totalNet >= 0 ? '' : ''}`} style={{ color: totalNet >= 0 ? 'var(--teal)' : '#E06A54' }}>
            {totalNet >= 0 ? '+' : ''}{fmt(totalNet)}
          </div>
        </article>
      </div>

      {/* Area chart */}
      <section className="chart-panel" aria-labelledby="cf-area-title" style={{ marginBottom: 'var(--sp-6)' }}>
        <h2 className="chart-panel__title" id="cf-area-title">Income vs Expenses</h2>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#1AA68A" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#1AA68A" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#C0503A" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#C0503A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(232,226,214,0.06)" />
            <XAxis dataKey="month" tick={{ fill: 'rgba(232,226,214,0.5)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtK} tick={{ fill: 'rgba(232,226,214,0.5)', fontSize: 12 }} axisLine={false} tickLine={false} width={52} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(val: number) => fmt(val)}
              labelStyle={{ color: '#E8E2D6', fontWeight: 600, marginBottom: 4 }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: 'rgba(232,226,214,0.7)' }}
            />
            <Area type="monotone" dataKey="income"   stroke="#1AA68A" fill="url(#incomeGrad)"  strokeWidth={2} name="Income"   />
            <Area type="monotone" dataKey="expenses" stroke="#C0503A" fill="url(#expenseGrad)" strokeWidth={2} name="Expenses" />
          </AreaChart>
        </ResponsiveContainer>
      </section>

      {/* Bar chart — net */}
      <section className="chart-panel" aria-labelledby="cf-bar-title">
        <h2 className="chart-panel__title" id="cf-bar-title">Monthly Net</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(232,226,214,0.06)" />
            <XAxis dataKey="month" tick={{ fill: 'rgba(232,226,214,0.5)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtK} tick={{ fill: 'rgba(232,226,214,0.5)', fontSize: 12 }} axisLine={false} tickLine={false} width={52} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(val: number) => fmt(val)}
              labelStyle={{ color: '#E8E2D6', fontWeight: 600, marginBottom: 4 }}
            />
            <Bar
              dataKey="net"
              name="Net"
              radius={[4, 4, 0, 0]}
              fill="#1AA68A"
              label={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </section>
    </div>
  )
}
