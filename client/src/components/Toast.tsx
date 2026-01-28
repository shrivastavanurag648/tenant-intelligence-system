import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastProps extends Toast {
  onClose: (id: string) => void
}

function ToastComponent({ id, type, title, message, duration = 5000, onClose }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id)
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [id, duration, onClose])

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info
  }

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  }

  const iconColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500'
  }

  const Icon = icons[type]

  return (
    <div className={`max-w-sm w-full border rounded-lg shadow-lg p-4 ${colors[type]} animate-slide-in-right`}>
      <div className="flex items-start">
        <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${iconColors[type]}`} />
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">{title}</p>
          {message && (
            <p className="text-sm mt-1 opacity-90">{message}</p>
          )}
        </div>
        <button
          onClick={() => onClose(id)}
          className="ml-4 flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// Toast container component
interface ToastContainerProps {
  toasts: Toast[]
  onClose: (id: string) => void
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastComponent
          key={toast.id}
          {...toast}
          onClose={onClose}
        />
      ))}
    </div>
  )
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { ...toast, id }])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const showSuccess = (title: string, message?: string, duration?: number) => {
    addToast({ type: 'success', title, message, duration })
  }

  const showError = (title: string, message?: string, duration?: number) => {
    addToast({ type: 'error', title, message, duration })
  }

  const showWarning = (title: string, message?: string, duration?: number) => {
    addToast({ type: 'warning', title, message, duration })
  }

  const showInfo = (title: string, message?: string, duration?: number) => {
    addToast({ type: 'info', title, message, duration })
  }

  return {
    toasts,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
}