import { Calendar, Clock } from 'lucide-react'
import { formatDate, formatRelativeTime } from '../services/api'

interface TimestampDisplayProps {
  date: Date | string
  label?: string
  showRelative?: boolean
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
  format?: 'full' | 'relative' | 'both'
}

export function TimestampDisplay({ 
  date, 
  label, 
  showRelative = true, 
  showIcon = true,
  size = 'md',
  format = 'both'
}: TimestampDisplayProps) {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const getSizeClasses = (size: 'sm' | 'md' | 'lg') => {
    switch (size) {
      case 'sm':
        return {
          text: 'text-xs',
          icon: 'h-3 w-3',
          spacing: 'space-y-0.5'
        }
      case 'md':
        return {
          text: 'text-sm',
          icon: 'h-4 w-4',
          spacing: 'space-y-1'
        }
      case 'lg':
        return {
          text: 'text-base',
          icon: 'h-5 w-5',
          spacing: 'space-y-1.5'
        }
      default:
        return {
          text: 'text-sm',
          icon: 'h-4 w-4',
          spacing: 'space-y-1'
        }
    }
  }

  const classes = getSizeClasses(size)

  const renderContent = () => {
    switch (format) {
      case 'full':
        return (
          <div className="flex items-center text-gray-600">
            {showIcon && <Calendar className={`${classes.icon} mr-1.5`} />}
            <div>
              {label && <span className={`text-gray-500 ${classes.text} block`}>{label}</span>}
              <span className={`font-medium text-gray-900 ${classes.text}`}>
                {formatDate(dateObj)}
              </span>
            </div>
          </div>
        )
      
      case 'relative':
        return (
          <div className="flex items-center text-gray-600">
            {showIcon && <Clock className={`${classes.icon} mr-1.5`} />}
            <div>
              {label && <span className={`text-gray-500 ${classes.text} block`}>{label}</span>}
              <span className={`font-medium text-gray-700 ${classes.text}`}>
                {formatRelativeTime(dateObj)}
              </span>
            </div>
          </div>
        )
      
      case 'both':
      default:
        return (
          <div className="flex items-center text-gray-600">
            {showIcon && <Calendar className={`${classes.icon} mr-1.5`} />}
            <div className={classes.spacing}>
              {label && <span className={`text-gray-500 ${classes.text} block`}>{label}</span>}
              <span className={`font-medium text-gray-900 ${classes.text} block`}>
                {formatDate(dateObj)}
              </span>
              <span className={`text-gray-600 ${classes.text}`}>
                {formatRelativeTime(dateObj)}
              </span>
            </div>
          </div>
        )
    }
  }

  return renderContent()
}