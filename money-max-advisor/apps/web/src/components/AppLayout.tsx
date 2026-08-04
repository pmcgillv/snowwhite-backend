import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AppNav } from './AppNav'
import { IconMenu } from './Icons'

export function AppLayout() {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="app-layout">
      {/* Mobile top bar */}
      <div className="app-topbar" aria-label="Mobile navigation bar">
        <span className="app-topbar__wordmark">Ledgerline</span>
        <button
          className="app-topbar__menu-btn"
          onClick={() => setNavOpen(v => !v)}
          aria-label="Toggle navigation"
          aria-expanded={navOpen}
        >
          <IconMenu size={20} />
        </button>
      </div>

      <AppNav open={navOpen} onClose={() => setNavOpen(false)} />

      <main className="app-main" id="main-content">
        <Outlet />
      </main>
    </div>
  )
}
