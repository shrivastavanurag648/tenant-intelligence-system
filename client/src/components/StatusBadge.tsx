import { ComplaintStatus } from '../../../shared/src/types'

interface StatusBadgeProps {
  status: ComplaintStatus
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

export function StatusBadge({ status, size = 'md', showIcon = false }: StatusBadgeProps) {
  const getStatusConfig = (status: ComplaintStatus) => {
    switch (status) {
      case ComplaintStatus.REPORTED:
        return {
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: '📝',
          label: 'Reported'
        }
      case ComplaintStatus.UNDER_REVIEW:
        return {
          className: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: '👀',
          label: 'Under Review'
        }
      case ComplaintStatus.RESOLVED:
        return {
          className: 'bg-green-100 text-green-800 border-green-200',
          icon: '✅',
          label: 'Resolved'
        }
      case ComplaintStatus.DISMISSED:
        return {
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: '❌',
          label: 'Dismissed'
        }
      default:
        return {
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: '❓',
          label: status
        }
    }
  }

  const getSizeClasses = (size: 'sm' | 'md' | 'lg') => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs'
      case 'md':
        return 'px-2.5 py-1.5 text-sm'
      case 'lg':
        return 'px-3 py-2 text-base'
      default:
        return 'px-2.5 py-1.5 text-sm'
    }
  }

  const config = getStatusConfig(status)
  const sizeClasses = getSizeClasses(size)

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${config.className} ${sizeClasses}`}>
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </span>
  )
}