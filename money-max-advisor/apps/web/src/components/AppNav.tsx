import { NavLink } from 'react-router-dom'
import {
  IconDashboard,
  IconAccounts,
  IconBudgets,
  IconActions,
  IconCashflow,
  IconReports,
  IconSetup,
  IconAdvisor,
  IconSettings,
} from './Icons'

interface NavItem {
  to: string
  label: string
  Icon: React.ComponentType<{ className?: string; size?: number }>
  end?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/app',          label: 'Dashboard',    Icon: IconDashboard, end: true },
  { to: '/app/accounts', label: 'Accounts',     Icon: IconAccounts  },
  { to: '/app/budgets',  label: 'Budgets',      Icon: IconBudgets   },
  { to: '/app/actions',  label: 'Action Plan',  Icon: IconActions   },
  { to: '/app/cashflow', label: 'Cashflow',     Icon: IconCashflow  },
  { to: '/app/reports',  label: 'Reports',      Icon: IconReports   },
  { to: '/app/setup',    label: 'Setup',        Icon: IconSetup     },
  { to: '/app/advisor',  label: 'Advisor',      Icon: IconAdvisor   },
  { to: '/app/settings', label: 'Settings',     Icon: IconSettings  },
]

interface AppNavProps {
  open: boolean
  onClose: () => void
}

export function AppNav({ open, onClose }: AppNavProps) {
  return (
    <>
      <nav className={`app-nav${open ? ' open' : ''}`} aria-label="Main navigation">
        <div className="app-nav__header">
          <NavLink to="/" className="app-nav__wordmark" onClick={onClose} aria-label="Ledgerline home">
            <svg className="app-nav__wordmark-svg" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect width="32" height="32" rx="6" fill="#061018"/>
              <path d="M6 22 L16 10 L26 22" stroke="#1AA68A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="4" y1="22" x2="28" y2="22" stroke="#E8E2D6" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Ledgerline
          </NavLink>
        </div>

        <div className="app-nav__menu">
          {NAV_ITEMS.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `app-nav__link${isActive ? ' active' : ''}`
              }
            >
              <Icon className="app-nav__link-icon" size={18} />
              {label}
            </NavLink>
          ))}
        </div>

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

      <div
        className={`nav-overlay${open ? ' open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
    </>
  )
}
