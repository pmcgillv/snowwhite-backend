import { useState } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { useFetch } from '../hooks/useFetch'
import { LoadingState, ErrorState, EmptyState } from '../components/LoadingState'
import { IconShield } from '../components/Icons'
import { AddAccountModal } from '../components/AddAccountModal'
import type { Account, AccountType, CashflowPoint } from '../api/client'

const TYPE_LABELS: Record<AccountType, string> = {
  checking: 'Checking',
  savings: 'Savings',
  credit: 'Credit Card',
  heloc: 'Line of Credit',
  loan: 'Loan',
  mortgage: 'Mortgage',
  investment: 'Investment',
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)

function fmtK(n: number) {
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(1)}k`
  return `$${n}`
}

function accountIsDebt(type: AccountType): boolean {
  switch (type) {
    case 'credit':
    case 'heloc':
    case 'loan':
    case 'mortgage':
      return true
    case 'checking':
    case 'savings':
    case 'investment':
      return false
    default: {
      const _exhaustive: never = type
      void _exhaustive
      return false
    }
  }
}

const tooltipStyle = {
  backgroundColor: '#0D1E2B',
  border: '1px solid rgba(232,226,214,0.12)',
  borderRadius: 8,
  color: '#E8E2D6',
}

export default function Accounts() {
  const [showAddModal, setShowAddModal] = useState(false)
  const { data, loading, error, refetch } = useFetch<{ accounts: Account[] }>('/api/accounts')
  const cashflowRes = useFetch<{ points: CashflowPoint[] }>('/api/cashflow?range=90d')

  if (loading) return <LoadingState text="Fetching your accounts…" />
  if (error || !data) return <ErrorState message={error ?? 'No accounts data'} onRetry={refetch} />

  const accounts = data.accounts
  if (accounts.length === 0) return <EmptyState text="No accounts connected yet." />

  const assets = accounts.filter((a) => !accountIsDebt(a.type))
  const debts = accounts.filter((a) => accountIsDebt(a.type))

  const totalAssets = assets.reduce((s, a) => s + Math.abs(a.balance), 0)
  const totalDebt = debts.reduce((s, a) => s + Math.abs(a.balance), 0)
  const netWorth = totalAssets - totalDebt

  // Cashflow chart data from checking account balance trend
  const cashflowPoints = cashflowRes.data?.points ?? []
  const chartData = cashflowPoints.map((p) => ({
    day: p.date.slice(5),
    balance: p.balance,
    inflow: p.inflow,
    outflow: p.outflow,
  }))

  // Net cashflow summary table
  const totalDeposits = cashflowPoints.reduce((s, p) => s + p.inflow, 0)
  const totalWithdrawals = cashflowPoints.reduce((s, p) => s + p.outflow, 0)
  const startBalance = cashflowPoints[0]?.balance ?? 0
  const endBalance = cashflowPoints[cashflowPoints.length - 1]?.balance ?? 0

  return (
    <div className="app-page page-enter" role="main" aria-labelledby="accounts-title">
      <header className="app-page__header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="app-page__title" id="accounts-title">
            Accounts
          </h1>
          <p className="app-page__subtitle">Your assets, liabilities, and cashflow.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
          + Add Account
        </button>
      </header>

      <div className="readonly-notice" role="note">
        <span className="readonly-notice__icon" aria-hidden="true">
          <IconShield size={16} />
        </span>
        <p className="readonly-notice__text">
          <strong>Read-only.</strong> Ledgerline reads balances; it never moves money automatically.
        </p>
      </div>

      {/* Summary */}
      <div className="grid-3" style={{ marginBottom: 'var(--sp-8)' }}>
        <article className="stat-card">
          <div className="stat-card__label">Total Assets</div>
          <div className="stat-card__value display" style={{ color: 'var(--teal)' }}>
            {fmt(totalAssets)}
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-card__label">Total Debt</div>
          <div className="stat-card__value display" style={{ color: '#E06A54' }}>
            {fmt(totalDebt)}
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-card__label">Net Worth</div>
          <div
            className="stat-card__value display"
            style={{ color: netWorth >= 0 ? 'var(--teal)' : '#E06A54' }}
          >
            {fmt(netWorth)}
          </div>
        </article>
      </div>

      {/* Assets */}
      {assets.length > 0 && (
        <section style={{ marginBottom: 'var(--sp-8)' }} aria-labelledby="assets-heading">
          <h2 className="section-header__title" id="assets-heading" style={{ marginBottom: 'var(--sp-4)' }}>
            Assets
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            {assets.map((a) => (
              <article key={a.id} className="account-row">
                <div className="account-row__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>
                <div className="account-row__info">
                  <div className="account-row__name">{a.name}</div>
                  <div className="account-row__meta">
                    {a.institution} · {TYPE_LABELS[a.type]}
                  </div>
                </div>
                <div className="account-row__balance account-row__balance--positive">
                  {fmt(a.balance)}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Debts */}
      {debts.length > 0 && (
        <section style={{ marginBottom: 'var(--sp-8)' }} aria-labelledby="debts-heading">
          <h2 className="section-header__title" id="debts-heading" style={{ marginBottom: 'var(--sp-4)' }}>
            Liabilities
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            {debts.map((a) => (
              <article key={a.id} className="account-row">
                <div className="account-row__icon" style={{ background: 'rgba(192,80,58,0.1)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#E06A54" strokeWidth="1.75" aria-hidden="true">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>
                <div className="account-row__info">
                  <div className="account-row__name">{a.name}</div>
                  <div className="account-row__meta">
                    {a.institution} · {TYPE_LABELS[a.type]} ·{' '}
                    {a.interestRateAPR.toFixed(2)}% APR
                  </div>
                  {a.minimumPayment && (
                    <div className="account-row__sub">
                      Min. payment {fmt(a.minimumPayment)}
                    </div>
                  )}
                </div>
                <div className="account-row__balance account-row__balance--negative">
                  {fmt(Math.abs(a.balance))}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Strategic checking running balance chart */}
      {chartData.length > 0 && (
        <section style={{ marginBottom: 'var(--sp-8)' }} aria-labelledby="balance-chart-heading">
          <h2 className="section-header__title" id="balance-chart-heading" style={{ marginBottom: 'var(--sp-4)' }}>
            Checking Account — Running Balance
          </h2>
          <div className="chart-panel">
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <AreaChart data={chartData}>
                  <CartesianGrid stroke="rgba(232,226,214,0.08)" />
                  <XAxis
                    dataKey="day"
                    stroke="#E8E2D6"
                    tick={{ fill: '#E8E2D6', fontSize: 11 }}
                  />
                  <YAxis
                    tickFormatter={fmtK}
                    stroke="#E8E2D6"
                    tick={{ fill: '#E8E2D6', fontSize: 11 }}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="#1AA68A"
                    fill="rgba(26,166,138,0.15)"
                    strokeWidth={2}
                    dot={false}
                    name="Balance"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {/* Net cashflow summary table */}
      {cashflowPoints.length > 0 && (
        <section aria-labelledby="cashflow-summary-heading">
          <h2 className="section-header__title" id="cashflow-summary-heading" style={{ marginBottom: 'var(--sp-4)' }}>
            Net Cashflow Summary
          </h2>
          <div className="cashflow-summary-table">
            <div className="cashflow-summary-table__row cashflow-summary-table__row--header">
              <span>Start Balance</span>
              <span>Deposits</span>
              <span>Withdrawals</span>
              <span>End Balance</span>
            </div>
            <div className="cashflow-summary-table__row">
              <span className="cashflow-summary-table__val">{fmt(startBalance)}</span>
              <span className="cashflow-summary-table__val cashflow-summary-table__val--in">
                +{fmt(totalDeposits)}
              </span>
              <span className="cashflow-summary-table__val cashflow-summary-table__val--out">
                −{fmt(totalWithdrawals)}
              </span>
              <span
                className={`cashflow-summary-table__val ${
                  endBalance >= startBalance
                    ? 'cashflow-summary-table__val--in'
                    : 'cashflow-summary-table__val--out'
                }`}
              >
                {fmt(endBalance)}
              </span>
            </div>
          </div>
        </section>
      )}

      {showAddModal && <AddAccountModal onClose={() => setShowAddModal(false)} />}
    </div>
  )
}
