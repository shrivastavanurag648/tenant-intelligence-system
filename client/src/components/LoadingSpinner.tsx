import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
  className?: string
}

export function LoadingSpinner({ size = 'md', message, className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`animate-spin text-primary-600 ${sizeClasses[size]}`} />
      {message && (
        <span className={`ml-2 text-gray-600 ${textSizeClasses[size]}`}>
          {message}
        </span>
      )}
    </div>
  )
}

interface LoadingCardProps {
  title?: string
  message?: string
  className?: string
}

export function LoadingCard({ title = 'Loading...', message, className = '' }: LoadingCardProps) {
  return (
    <div className={`card text-center py-12 ${className}`}>
      <LoadingSpinner size="lg" />
      <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">{title}</h3>
      {message && (
        <p className="text-gray-600">{message}</p>
      )}
    </div>
  )
}

interface LoadingOverlayProps {
  message?: string
  show: boolean
}

export function LoadingOverlay({ message = 'Loading...', show }: LoadingOverlayProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
        <LoadingSpinner size="lg" message={message} />
      </div>
    </div>
  )
}