interface LoadingStateProps {
  text?: string
}

export function LoadingState({ text = 'Loading…' }: LoadingStateProps) {
  return (
    <div className="loading-state page-enter">
      <div className="loading-state__spinner" />
      <p className="loading-state__text">{text}</p>
    </div>
  )
}

interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const isOffline =
    message.toLowerCase().includes('failed to fetch') ||
    message.toLowerCase().includes('networkerror') ||
    message.toLowerCase().includes('network')

  return (
    <div className="error-state page-enter">
      {isOffline ? (
        <div className="reconnect-banner" style={{ maxWidth: 480, margin: '0 auto' }}>
          <span className="reconnect-banner__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
          </span>
          <div className="reconnect-banner__text">
            <div className="reconnect-banner__title">API Unreachable</div>
            <div className="reconnect-banner__sub">
              Could not connect to the Ledgerline API. Make sure the server is running at{' '}
              <code style={{ fontFamily: 'monospace', fontSize: '0.8em' }}>
                {(import.meta.env?.VITE_API_URL as string | undefined) ?? 'http://localhost:4000'}
              </code>
            </div>
          </div>
        </div>
      ) : (
        <p className="error-state__text">{message}</p>
      )}
      {onRetry && (
        <button className="btn btn-ghost" onClick={onRetry}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
          </svg>
          Try again
        </button>
      )}
    </div>
  )
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="empty-state page-enter">
      <p className="empty-state__text">{text}</p>
    </div>
  )
}
