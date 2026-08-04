import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useFetch } from '../hooks/useFetch'
import { AddFlowModal } from './AddFlowModal'
import type { FlowType } from './AddFlowModal'
import type { DashboardSummary } from '../api/client'
import {
  IconSetup,
  IconAdvisor,
  IconSettings,
  IconAccounts,
  IconCashflow,
} from './Icons'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)

interface AppNavProps {
  open: boolean
  onClose: () => void
}

export function AppNav({ open, onClose }: AppNavProps) {
  const [flowType, setFlowType] = useState<FlowType | null>(null)
  const dash = useFetch<DashboardSummary>('/api/dashboard')

  function openFlow(type: FlowType) {
    setFlowType(type)
    onClose()
  }

  return (
    <>
      <nav
        className={`app-nav${open ? ' open' : ''}`}
        aria-label="Main navigation"
      >
        {/* Brand */}
        <div className="app-nav__header">
          <NavLink
            to="/app"
            end
            className="app-nav__wordmark"
            onClick={onClose}
            aria-label="Ledgerline home"
          >
            <svg
              className="app-nav__wordmark-svg"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <rect width="32" height="32" rx="6" fill="#061018" />
              <path
                d="M6 22 L16 10 L26 22"
                stroke="#1AA68A"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                x1="4"
                y1="22"
                x2="28"
                y2="22"
                stroke="#E8E2D6"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            Ledgerline
          </NavLink>
        </div>

        {/* Quick action buttons */}
        <div className="app-nav__actions">
          <button
            className="app-nav__flow-btn app-nav__flow-btn--income"
            onClick={() => openFlow('income')}
          >
            + Add Income
          </button>
          <button
            className="app-nav__flow-btn app-nav__flow-btn--expense"
            onClick={() => openFlow('expense')}
          >
            + Add Expense
          </button>
          <button
            className="app-nav__flow-btn app-nav__flow-btn--transfer"
            onClick={() => openFlow('transfer')}
          >
            + Add Transfer
          </button>
        </div>

        {/* Monthly summary */}
        <div className="app-nav__summary">
          <div className="app-nav__summary-label">This Month</div>
          <div className="app-nav__summary-row">
            <span className="app-nav__summary-key">Monthly Income</span>
            <span className="app-nav__summary-val app-nav__summary-val--income">
              {dash.data ? fmt(dash.data.monthlyIncome) : '—'}
            </span>
          </div>
          <div className="app-nav__summary-row">
            <span className="app-nav__summary-key">Monthly Expenses</span>
            <span className="app-nav__summary-val app-nav__summary-val--expense">
              {dash.data ? fmt(dash.data.monthlyExpenses) : '—'}
            </span>
          </div>
          <div className="app-nav__summary-row">
            <span className="app-nav__summary-key">Avg Discretionary</span>
            <span className="app-nav__summary-val">
              {dash.data ? fmt(dash.data.discretionaryIncome) : '—'}
            </span>
          </div>
        </div>

        {/* Quick links */}
        <div className="app-nav__section">
          <div className="app-nav__section-label">Quick Links</div>
          <NavLink
            to="/app/accounts"
            onClick={onClose}
            className={({ isActive }) => `app-nav__link${isActive ? ' active' : ''}`}
          >
            <IconAccounts className="app-nav__link-icon" size={16} />
            Accounts Overview
          </NavLink>
          <NavLink
            to="/app/cashflow"
            onClick={onClose}
            className={({ isActive }) => `app-nav__link${isActive ? ' active' : ''}`}
          >
            <IconCashflow className="app-nav__link-icon" size={16} />
            Cashflow Report
          </NavLink>
        </div>

        {/* Secondary nav */}
        <div className="app-nav__section app-nav__section--secondary">
          <div className="app-nav__section-label">More</div>
          <NavLink
            to="/app/setup"
            onClick={onClose}
            className={({ isActive }) => `app-nav__link${isActive ? ' active' : ''}`}
          >
            <IconSetup className="app-nav__link-icon" size={16} />
            Setup
          </NavLink>
          <NavLink
            to="/app/advisor"
            onClick={onClose}
            className={({ isActive }) => `app-nav__link${isActive ? ' active' : ''}`}
          >
            <IconAdvisor className="app-nav__link-icon" size={16} />
            Advisor
          </NavLink>
          <NavLink
            to="/app/settings"
            onClick={onClose}
            className={({ isActive }) => `app-nav__link${isActive ? ' active' : ''}`}
          >
            <IconSettings className="app-nav__link-icon" size={16} />
            Settings
          </NavLink>
        </div>

        {/* User footer */}
        <div className="app-nav__footer">
          <div className="app-nav__user">
            <div className="app-nav__avatar" aria-hidden="true">J</div>
            <div className="app-nav__user-info">
              <div className="app-nav__user-name">Jordan Smith</div>
              <div className="app-nav__user-role">Pro Plan</div>
            </div>
          </div>
        </div>
      </nav>

      {/* Flow modal */}
      {flowType && (
        <AddFlowModal type={flowType} onClose={() => setFlowType(null)} />
      )}

      {/* Mobile overlay */}
      <div
        className={`nav-overlay${open ? ' open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
    </>
  )
}
