import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { AppNav } from './AppNav'
import { KpiBar } from './KpiBar'
import { IconMenu } from './Icons'

const PRIMARY_TABS = [
  { to: '/app/actions', label: 'Action Plan' },
  { to: '/app/budgets', label: 'Budget' },
  { to: '/app/accounts', label: 'Accounts' },
  { to: '/app/reports', label: 'Reports' },
]

export function AppLayout() {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="app-layout">
      {/* Mobile top bar */}
      <div className="app-topbar" aria-label="Mobile navigation bar">
        <span className="app-topbar__wordmark">Ledgerline</span>
        <button
          className="app-topbar__menu-btn"
          onClick={() => setNavOpen((v) => !v)}
          aria-label="Toggle navigation"
          aria-expanded={navOpen}
        >
          <IconMenu size={20} />
        </button>
      </div>

      <AppNav open={navOpen} onClose={() => setNavOpen(false)} />

      <main className="app-main" id="main-content">
        {/* Primary tab bar */}
        <div className="app-tabs" role="tablist" aria-label="Primary navigation">
          {PRIMARY_TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              role="tab"
              className={({ isActive }) => `app-tab${isActive ? ' active' : ''}`}
            >
              {tab.label}
            </NavLink>
          ))}
        </div>

        {/* KPI bar */}
        <KpiBar />

        {/* Page content */}
        <Outlet />
      </main>
    </div>
  )
}
