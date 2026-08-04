import { useState } from 'react'
import { api } from '../api/client'
import { IconX } from './Icons'
import type { InterestOnlyPeriod } from '../api/client'

type AccountKind = 'bank' | 'creditor' | 'mortgage' | 'asset'

const KIND_LABELS: Record<AccountKind, string> = {
  bank: 'Bank Account',
  creditor: 'Creditor / Loan',
  mortgage: 'Mortgage',
  asset: 'Asset',
}

interface AddAccountModalProps {
  onClose: () => void
  onAdded?: () => void
}

export function AddAccountModal({ onClose, onAdded }: AddAccountModalProps) {
  const [kind, setKind] = useState<AccountKind>('bank')
  const [name, setName] = useState('')
  const [institution, setInstitution] = useState('')
  const [balance, setBalance] = useState('')
  const [rate, setRate] = useState('')
  const [interestOnly, setInterestOnly] = useState(false)
  const [interestOnlyMonths, setInterestOnlyMonths] = useState('12')
  const [interestOnlyEndDate, setInterestOnlyEndDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const showDebtFields = kind === 'creditor' || kind === 'mortgage'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const interestOnlyPeriod: InterestOnlyPeriod | undefined =
      showDebtFields && interestOnly
        ? {
            active: true,
            months: interestOnlyMonths ? Number(interestOnlyMonths) : undefined,
            endDate: interestOnlyEndDate || undefined,
            startDate: new Date().toISOString().slice(0, 10),
          }
        : undefined

    try {
      await api.post('/api/accounts', {
        kind,
        name,
        institution: institution || undefined,
        balance: Number(balance),
        interestRateAPR: rate ? Number(rate) : 0,
        interestOnlyPeriod,
      })
      setToast(true)
      onAdded?.()
      setTimeout(() => {
        setToast(false)
        onClose()
      }, 1400)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add account')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-account-title"
      onClick={onClose}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title" id="add-account-title">
            Add Account
          </h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            <IconX size={18} />
          </button>
        </div>

        <div className="modal__tabs" role="tablist">
          {(Object.keys(KIND_LABELS) as AccountKind[]).map((k) => (
            <button
              key={k}
              role="tab"
              aria-selected={kind === k}
              className={`modal__tab${kind === k ? ' active' : ''}`}
              onClick={() => {
                setKind(k)
                if (k === 'bank' || k === 'asset') setInterestOnly(false)
              }}
            >
              {KIND_LABELS[k]}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="modal__form">
          <div className="form-group">
            <label className="form-label" htmlFor="acc-name">
              Account Name
            </label>
            <input
              id="acc-name"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chase Checking"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="acc-institution">
              Institution
            </label>
            <input
              id="acc-institution"
              className="form-input"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="e.g. Chase"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="acc-balance">
              {showDebtFields ? 'Balance Owed ($)' : 'Current Balance ($)'}
            </label>
            <input
              id="acc-balance"
              className="form-input"
              type="number"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          {showDebtFields && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="acc-rate">
                  Interest Rate (APR %)
                </label>
                <input
                  id="acc-rate"
                  className="form-input"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="e.g. 18.99"
                />
              </div>

              <div className="form-group form-group--check">
                <label className="form-check" htmlFor="acc-interest-only">
                  <input
                    id="acc-interest-only"
                    type="checkbox"
                    checked={interestOnly}
                    onChange={(e) => setInterestOnly(e.target.checked)}
                  />
                  <span>
                    Interest-only period
                    <span className="form-check__hint">
                      Common on new mortgages / HELOCs — principal stays flat until this ends
                    </span>
                  </span>
                </label>
              </div>

              {interestOnly && (
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="acc-io-months">
                      Interest-only months
                    </label>
                    <input
                      id="acc-io-months"
                      className="form-input"
                      type="number"
                      min="1"
                      max="120"
                      value={interestOnlyMonths}
                      onChange={(e) => setInterestOnlyMonths(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="acc-io-end">
                      Or end date
                    </label>
                    <input
                      id="acc-io-end"
                      className="form-input"
                      type="date"
                      value={interestOnlyEndDate}
                      onChange={(e) => setInterestOnlyEndDate(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <div className="modal__notice">
            <strong>Demo only</strong> — account is stored locally for planning. No bank
            connection is made. Interest-only periods steer extra principal to other debts.
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={submitting}
          >
            {submitting ? 'Adding…' : 'Add Account'}
          </button>
        </form>

        {toast && (
          <div className="toast" role="status">
            Account added
            {interestOnly ? ' with interest-only period' : ''}
          </div>
        )}
      </div>
    </div>
  )
}
