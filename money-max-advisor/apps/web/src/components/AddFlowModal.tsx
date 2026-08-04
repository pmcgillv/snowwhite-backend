import { useState } from 'react'
import { IconX } from './Icons'

export type FlowType = 'income' | 'expense' | 'transfer'

const FLOW_LABELS: Record<FlowType, string> = {
  income: 'Add Income',
  expense: 'Add Expense',
  transfer: 'Add Transfer',
}

const FLOW_DESCRIPTIONS: Record<FlowType, string> = {
  income: 'Record an income source or expected paycheck.',
  expense: 'Log a spending category or one-time expense.',
  transfer: 'Record a planned transfer between accounts.',
}

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Rental Income', 'Dividends', 'Other Income']
const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Bills & Utilities',
  'Transportation',
  'Shopping',
  'Healthcare',
  'Entertainment',
  'Other',
]
const FREQUENCIES = ['One-time', 'Weekly', 'Bi-weekly', 'Monthly', 'Quarterly']

interface AddFlowModalProps {
  type: FlowType
  onClose: () => void
}

export function AddFlowModal({ type, onClose }: AddFlowModalProps) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState('Monthly')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [toast, setToast] = useState(false)

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setToast(true)
    setTimeout(() => {
      setToast(false)
      onClose()
    }, 1800)
  }

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-flow-title"
      onClick={onClose}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title" id="add-flow-title">
            {FLOW_LABELS[type]}
          </h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            <IconX size={18} />
          </button>
        </div>

        <p className="modal__description">{FLOW_DESCRIPTIONS[type]}</p>

        <form onSubmit={handleSubmit} className="modal__form">
          <div className="form-group">
            <label className="form-label" htmlFor="flow-name">
              {type === 'transfer' ? 'Description' : 'Name'}
            </label>
            <input
              id="flow-name"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                type === 'income'
                  ? 'e.g. Paycheck'
                  : type === 'expense'
                    ? 'e.g. Grocery run'
                    : 'e.g. Debt payment sweep'
              }
              required
            />
          </div>

          {type !== 'transfer' && (
            <div className="form-group">
              <label className="form-label" htmlFor="flow-category">
                Category
              </label>
              <select
                id="flow-category"
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Select a category…</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="flow-amount">
              Amount ($)
            </label>
            <input
              id="flow-amount"
              className="form-input"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          {type !== 'transfer' && (
            <div className="form-group">
              <label className="form-label" htmlFor="flow-frequency">
                Frequency
              </label>
              <select
                id="flow-frequency"
                className="form-select"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              >
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="flow-date">
              Date
            </label>
            <input
              id="flow-date"
              className="form-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="modal__notice">
            <strong>Demo only</strong> — no data is sent to any bank or third party. Money never
            moves automatically.
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            {FLOW_LABELS[type]}
          </button>
        </form>

        {toast && (
          <div className="toast" role="status">
            {FLOW_LABELS[type]} recorded locally (demo mode)
          </div>
        )}
      </div>
    </div>
  )
}
