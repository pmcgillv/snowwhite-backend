import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Ledgerline UI crash', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="app-page page-enter" style={{ padding: '2rem' }}>
          <h1 className="app-page__title">Something went wrong</h1>
          <p className="app-page__subtitle">{this.state.error.message}</p>
          <button className="btn btn-primary" onClick={() => this.setState({ error: null })}>
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
