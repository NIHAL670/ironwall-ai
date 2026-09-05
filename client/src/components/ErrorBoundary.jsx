import { Component } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('UI Runtime Error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="card"
          style={{
            margin: '24px auto',
            maxWidth: 600,
            padding: 32,
            textAlign: 'center',
            border: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'rgba(244,63,94,0.15)',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 16px',
              color: 'var(--danger)',
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <h3 style={{ marginBottom: 8 }}>Something went wrong</h3>
          <p className="muted" style={{ fontSize: 13, marginBottom: 20 }}>
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="btn primary" onClick={this.handleReset}>
              <RotateCcw size={15} /> Try again
            </button>
            <button
              className="btn ghost"
              onClick={() => window.location.reload()}
            >
              Reload application
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
