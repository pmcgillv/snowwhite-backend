import { useFetch } from '../hooks/useFetch'
import { LoadingState, ErrorState, EmptyState } from '../components/LoadingState'
import { IconBank, IconAccounts, IconShield } from '../components/Icons'
import type { Account } from '../api/client'

const TYPE_LABELS: Record<Account['type'], string> = {
  checking:        'Checking',
  savings:         'Savings',
  credit_card:     'Credit Card',
  line_of_credit:  'Line of Credit',
  loan:            'Loan',
  investment:      'Investment',
}

function accountIsDebt(type: Account['type']) {
  return ['credit_card', 'line_of_credit', 'loan'].includes(type)
}

export default function Accounts() {
  const { data: accounts, loading, error, refetch } = useFetch<Account[]>('/api/accounts')

  if (loading) return <LoadingState text="Fetching your accounts…" />
  if (error || !accounts)
    return <ErrorState message={error ?? 'No accounts data'} onRetry={refetch} />
  if (accounts.length === 0) return <EmptyState text="No accounts connected yet." />

  const assets = accounts.filter(a => !accountIsDebt(a.type))
  const debts  = accounts.filter(a =>  accountIsDebt(a.type))

  return (
    <div className="app-page page-enter" role="main" aria-labelledby="accounts-title">
      <header className="app-page__header">
        <h1 className="app-page__title" id="accounts-title">Accounts</h1>
        <p className="app-page__subtitle">
          All connected accounts. Data syncs via your linked institution connections.
        </p>
      </header>

      <div className="readonly-notice" role="note" aria-label="Read-only notice">
        <span className="readonly-notice__icon" aria-hidden="true">
          <IconShield size={16} />
        </span>
        <p className="readonly-notice__text">
          <strong>Read-only integration.</strong> Ledgerline can read your account
          balances and transactions, but never initiates transfers or payments on your
          behalf. All actions require your explicit approval.
        </p>
      </div>

      {assets.length > 0 && (
        <section aria-labelledby="assets-heading" style={{ marginBottom: 'var(--sp-8)' }}>
          <div className="section-header">
            <h2 className="section-header__title" id="assets-heading">Assets</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            {assets.map(account => (
              <AccountRow key={account.id} account={account} />
            ))}
          </div>
        </section>
      )}

      {debts.length > 0 && (
        <section aria-labelledby="debts-heading">
          <div className="section-header">
            <h2 className="section-header__title" id="debts-heading">Debts</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            {debts.map(account => (
              <AccountRow key={account.id} account={account} isDebt />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function AccountRow({ account, isDebt = false }: { account: Account; isDebt?: boolean }) {
  return (
    <article className="account-row stagger-item" aria-label={`Account: ${account.name}`}>
      <div className="account-row__icon" aria-hidden="true">
        {account.type === 'investment' ? <IconAccounts /> : <IconBank />}
      </div>
      <div className="account-row__info">
        <div className="account-row__name">{account.name}</div>
        <div className="account-row__sub">
          {account.institution} · {TYPE_LABELS[account.type]}
          {account.interestRate != null && ` · ${account.interestRate}% APR`}
        </div>
        {account.limit != null && (
          <div className="account-row__sub">
            Limit: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(account.limit)}
          </div>
        )}
      </div>
      <div className={`account-row__balance ${isDebt ? 'account-row__balance--negative' : 'account-row__balance--positive'}`}>
        {isDebt ? '−' : '+'}{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.abs(account.balance))}
      </div>
      <span className={`badge ${account.connected ? 'badge-teal' : 'badge-muted'}`}>
        {account.connected ? 'Connected' : 'Offline'}
      </span>
    </article>
  )
}
