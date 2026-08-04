import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Landing from '../pages/Landing'

describe('Landing page', () => {
  it('renders the Ledgerline brand name', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    )
    const brandElements = screen.getAllByText(/Ledgerline/i)
    expect(brandElements.length).toBeGreaterThan(0)
  })

  it('renders the main h1 headline', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('renders the Open Dashboard CTA link', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    )
    const cta = screen.getByRole('link', { name: /Open Dashboard/i })
    expect(cta).toBeInTheDocument()
    expect(cta).toHaveAttribute('href', '/app')
  })

  it('renders feature card headings', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: /Intelligent Debt Strategy/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Action Plan/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Cashflow Clarity/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Wealth Projection/i })).toBeInTheDocument()
  })

  it('renders the footer copyright notice', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    )
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })
})
