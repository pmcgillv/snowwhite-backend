import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '../AppRoutes'

describe('Action Plan page', () => {
  it('renders the Approve button for pending actions', async () => {
    render(
      <MemoryRouter initialEntries={['/app/actions']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.queryByText(/loading action plan/i)).not.toBeInTheDocument()
    }, { timeout: 5000 })

    const approveBtns = await screen.findAllByRole('button', { name: /approve action/i })
    expect(approveBtns.length).toBeGreaterThan(0)
  })

  it('renders the Dismiss button for pending actions', async () => {
    render(
      <MemoryRouter initialEntries={['/app/actions']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    await waitFor(() => {
      const dismissBtns = screen.queryAllByRole('button', { name: /dismiss action/i })
      expect(dismissBtns.length).toBeGreaterThan(0)
    }, { timeout: 5000 })
  })

  it('shows the safety notice about money never moving automatically', async () => {
    render(
      <MemoryRouter initialEntries={['/app/actions']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText(/never moves automatically/i)).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('filter tabs are present', async () => {
    render(
      <MemoryRouter initialEntries={['/app/actions']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /^pending$/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /^all$/i })).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('filter tab switches to pending', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/app/actions']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    }, { timeout: 5000 })

    const pendingTab = await screen.findByRole('tab', { name: /^pending$/i })
    await user.click(pendingTab)
    expect(pendingTab).toHaveAttribute('aria-selected', 'true')
  })
})
