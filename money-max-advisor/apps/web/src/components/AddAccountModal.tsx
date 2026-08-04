import { useState } from 'react'
import { IconX } from './Icons'

type AccountKind = 'bank' | 'creditor' | 'mortgage' | 'asset'

const KIND_LABELS: Record<AccountKind, string> = {
  bank: 'Bank Account',
  creditor: 'Creditor / Loan',
  mortgage: 'Mortgage',
  asset: 'Asset',
}

interface AddAccountModalProps {
  onClose: () => void
}

export function AddAccountModal({ onClose }: AddAccountModalProps) {
  const [kind, setKind] = useState<AccountKind>('bank')
  const [name, setName] = useState('')
  const [institution, setInstitution] = useState('')
  const [balance, setBalance] = useState('')
  const [rate, setRate] = useState('')
  const [toast, setToast] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setToast(true)
    setTimeout(() => {
      setToast(false)
      onClose()
    }, 1800)
  }

  const showRate = kind === 'creditor' || kind === 'mortgage'

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
              onClick={() => setKind(k)}
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
              {kind === 'creditor' || kind === 'mortgage' ? 'Balance Owed ($)' : 'Current Balance ($)'}
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

          {showRate && (
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
          )}

          <div className="modal__notice">
            <strong>Demo only</strong> — no data is sent to any bank or third party.
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Add Account
          </button>
        </form>

        {toast && (
          <div className="toast" role="status">
            Account added locally (demo mode)
          </div>
        )}
      </div>
    </div>
  )
}
