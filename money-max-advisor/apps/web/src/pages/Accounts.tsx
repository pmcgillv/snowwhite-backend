import { useFetch } from '../hooks/useFetch'
import { LoadingState, ErrorState, EmptyState } from '../components/LoadingState'
import { IconShield } from '../components/Icons'
import type { Account, AccountType } from '../api/client'

const TYPE_LABELS: Record<AccountType, string> = {
  checking: 'Checking',
  savings: 'Savings',
  credit: 'Credit Card',
  heloc: 'Line of Credit',
  loan: 'Loan',
  mortgage: 'Mortgage',
  investment: 'Investment',
}

function accountIsDebt(type: AccountType) {
  return ['credit', 'heloc', 'loan', 'mortgage'].includes(type)
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

export default function Accounts() {
  const { data, loading, error, refetch } = useFetch<{ accounts: Account[] }>('/api/accounts')

  if (loading) return <LoadingState text="Fetching your accounts…" />
  if (error || !data) return <ErrorState message={error ?? 'No accounts data'} onRetry={refetch} />

  const accounts = data.accounts
  if (accounts.length === 0) return <EmptyState text="No accounts connected yet." />

  const assets = accounts.filter((a) => !accountIsDebt(a.type))
  const debts = accounts.filter((a) => accountIsDebt(a.type))

  return (
    <div className="app-page page-enter" role="main" aria-labelledby="accounts-title">
      <header className="app-page__header">
        <h1 className="app-page__title" id="accounts-title">Accounts</h1>
        <p className="app-page__subtitle">
          Demo ledger accounts (later: Firefly III + SimpleFIN).
        </p>
      </header>

      <div className="readonly-notice" role="note">
        <span className="readonly-notice__icon" aria-hidden="true">
          <IconShield size={16} />
        </span>
        <p className="readonly-notice__text">
          <strong>Read-only.</strong> Ledgerline reads balances; it never moves money.
        </p>
      </div>

      {assets.length > 0 && (
        <section style={{ marginBottom: 'var(--sp-8)' }}>
          <h2 className="section-header__title">Assets</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            {assets.map((a) => (
              <article key={a.id} className="account-row">
                <div>
                  <div className="account-row__name">{a.name}</div>
                  <div className="account-row__meta">
                    {a.institution} · {TYPE_LABELS[a.type]}
                  </div>
                </div>
                <div className="account-row__balance">{fmt(a.balance)}</div>
              </article>
            ))}
          </div>
        </section>
      )}

      {debts.length > 0 && (
        <section>
          <h2 className="section-header__title">Debts</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            {debts.map((a) => (
              <article key={a.id} className="account-row">
                <div>
                  <div className="account-row__name">{a.name}</div>
                  <div className="account-row__meta">
                    {a.institution} · {TYPE_LABELS[a.type]} · {a.interestRateAPR.toFixed(2)}% APR
                  </div>
                </div>
                <div className="account-row__balance">{fmt(Math.abs(a.balance))}</div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
