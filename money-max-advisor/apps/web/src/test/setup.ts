import '@testing-library/jest-dom'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './msw/server'
import { resetMockActions } from './msw/handlers'

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
  resetMockActions()
  server.resetHandlers()
})
afterAll(() => server.close())
