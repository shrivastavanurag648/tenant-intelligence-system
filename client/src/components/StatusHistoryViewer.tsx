import { useState } from 'react'
import { ChevronUp, ChevronDown, Clock, User } from 'lucide-react'
import { StatusHistory, ComplaintStatus } from '../../../shared/src/types'
import { StatusBadge } from './StatusBadge'
import { TimestampDisplay } from './TimestampDisplay'

interface StatusHistoryViewerProps {
  history: StatusHistory[]
  title?: string
  defaultExpanded?: boolean
}

export function StatusHistoryViewer({ 
  history, 
  title = "Status History",
  defaultExpanded = false 
}: StatusHistoryViewerProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  if (history.length === 0) {
    return null
  }

  const getStatusIcon = (status: ComplaintStatus) => {
    switch (status) {
      case ComplaintStatus.REPORTED:
        return '📝'
      case ComplaintStatus.UNDER_REVIEW:
        return '👀'
      case ComplaintStatus.RESOLVED:
        return '✅'
      case ComplaintStatus.DISMISSED:
        return '❌'
      default:
        return '📋'
    }
  }

  return (
    <div className="card">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-md p-1 -m-1"
      >
        <div className="flex items-center">
          <Clock className="h-5 w-5 text-gray-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <span className="ml-2 text-sm text-gray-500">({history.length} changes)</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>
      
      {isExpanded && (
        <div className="mt-4">
          {/* Timeline */}
          <div className="flow-root">
            <ul className="-mb-8">
              {history.map((entry, index) => (
                <li key={entry.id}>
                  <div className="relative pb-8">
                    {/* Timeline line */}
                    {index !== history.length - 1 && (
                      <span 
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" 
                        aria-hidden="true" 
                      />
                    )}
                    
                    <div className="relative flex space-x-3">
                      {/* Status icon */}
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm">
                        {getStatusIcon(entry.newStatus)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            Status changed to
                          </span>
                          <StatusBadge status={entry.newStatus} size="sm" />
                        </div>
                        
                        {entry.notes && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-700">{entry.notes}</p>
                          </div>
                        )}
                        
                        <div className="mt-2">
                          <TimestampDisplay 
                            date={entry.changedAt}
                            format="both"
                            size="sm"
                            showIcon={false}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Summary */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">{history.length}</div>
                <div className="text-sm text-gray-500">Total Changes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round((Date.now() - new Date(history[0].changedAt).getTime()) / (1000 * 60 * 60 * 24))}
                </div>
                <div className="text-sm text-gray-500">Days Since First Change</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {history[history.length - 1].newStatus === ComplaintStatus.RESOLVED ? '✓' : '⏳'}
                </div>
                <div className="text-sm text-gray-500">
                  {history[history.length - 1].newStatus === ComplaintStatus.RESOLVED ? 'Resolved' : 'In Progress'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}