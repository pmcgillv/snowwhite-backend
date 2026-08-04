import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import Landing   from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Accounts  from './pages/Accounts'
import Budgets   from './pages/Budgets'
import Actions   from './pages/Actions'
import Cashflow  from './pages/Cashflow'
import Reports   from './pages/Reports'
import PayoffMetrics from './pages/PayoffMetrics'
import Setup     from './pages/Setup'
import Settings  from './pages/Settings'
import Advisor   from './pages/Advisor'

export function AppRoutes() {
  return (
    <Routes>
      {/* Landing */}
      <Route path="/" element={<Landing />} />

      {/* App shell */}
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="budgets"  element={<Budgets />} />
        <Route path="actions"  element={<Actions />} />
        <Route path="cashflow" element={<Cashflow />} />
        <Route path="reports"  element={<Reports />} />
        <Route path="payoff"   element={<PayoffMetrics />} />
        <Route path="setup"    element={<Setup />} />
        <Route path="settings" element={<Settings />} />
        <Route path="advisor"  element={<Advisor />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
