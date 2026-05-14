import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }

type State = { hasError: boolean; error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, textAlign: 'center' }}>
          <h2>Bir hata oluştu</h2>
          <p>Sayfa yüklenirken beklenmeyen bir sorun çıktı.</p>
          <button type="button" className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => window.location.reload()}>
            Sayfayı Yenile
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
