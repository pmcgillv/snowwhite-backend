import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { AppRoutes } from '../AppRoutes'

describe('App routing — landing page', () => {
  it('renders the Ledgerline brand on the landing page', () => {
    render(<App />)
    const brandEls = screen.getAllByText(/Ledgerline/i)
    expect(brandEls.length).toBeGreaterThan(0)
  })

  it('renders landing headline about debt', () => {
    render(<App />)
    expect(screen.getByText(/faster than you think/i)).toBeInTheDocument()
  })

  it('has a call-to-action link to the dashboard', () => {
    render(<App />)
    const ctaLink = screen.getByRole('link', { name: /Open Dashboard/i })
    expect(ctaLink).toBeInTheDocument()
    expect(ctaLink).toHaveAttribute('href', '/app')
  })
})

describe('Dashboard route', () => {
  it('renders dashboard KPI section after API resolves', async () => {
    render(
      <MemoryRouter initialEntries={['/app']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    // Wait for the page content to appear (Debt-Free Date text is unique to the stat card)
    const debtFreeDateEls = await screen.findAllByText(/Debt-Free Date/i, {}, { timeout: 8000 })
    expect(debtFreeDateEls.length).toBeGreaterThan(0)
  })

  it('renders "Interest Saved" KPI', async () => {
    render(
      <MemoryRouter initialEntries={['/app']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    // Interest Saved appears in both the KPI bar tile and the dashboard stat card
    const interestSavedEls = await screen.findAllByText(/Interest Saved/i, {}, { timeout: 8000 })
    expect(interestSavedEls.length).toBeGreaterThan(0)
  })

  it('renders "Next Actions" section', async () => {
    render(
      <MemoryRouter initialEntries={['/app']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText(/Next Actions/i)).toBeInTheDocument()
    }, { timeout: 8000 })
  })
})
