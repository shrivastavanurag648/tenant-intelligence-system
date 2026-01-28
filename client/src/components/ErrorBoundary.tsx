import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full mx-4">
            <div className="card text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Something went wrong
              </h2>
              <p className="text-gray-600 mb-6">
                We encountered an unexpected error. This has been logged and we'll look into it.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="btn-primary w-full flex items-center justify-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </button>
                
                <button
                  onClick={() => window.location.href = '/'}
                  className="btn-secondary w-full flex items-center justify-center"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

interface ErrorMessageProps {
  title?: string
  message: string
  onRetry?: () => void
  className?: string
}

export function ErrorMessage({ 
  title = 'Error', 
  message, 
  onRetry, 
  className = '' 
}: ErrorMessageProps) {
  return (
    <div className={`card bg-red-50 border-red-200 ${className}`}>
      <div className="flex items-start">
        <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <p className="text-sm text-red-700 mt-1">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-md transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}