import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '../AppRoutes'

describe('Payoff metrics page', () => {
  it('renders full payoff metrics from KPI drill-down', async () => {
    render(
      <MemoryRouter initialEntries={['/app/payoff']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: /Payoff Metrics/i })).toBeInTheDocument()
    const yearsLabels = await screen.findAllByText(/Years to Pay Off/i)
    expect(yearsLabels.length).toBeGreaterThan(0)
    expect(screen.getByText(/Interest Saved Breakdown/i)).toBeInTheDocument()
    expect(screen.getByText(/Upcoming Debt Moves/i)).toBeInTheDocument()
  })

  it('shows Payoff in primary tabs', async () => {
    render(
      <MemoryRouter initialEntries={['/app/payoff']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    const tabs = await screen.findAllByRole('tab', { name: /^Payoff$/i })
    expect(tabs.length).toBeGreaterThan(0)
  })
})
