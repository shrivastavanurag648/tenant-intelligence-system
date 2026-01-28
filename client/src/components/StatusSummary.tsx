import { ComplaintStatus } from '../../../shared/src/types'
import { StatusBadge } from './StatusBadge'

interface StatusSummaryProps {
  statusCounts: Record<ComplaintStatus, number>
  totalComplaints: number
  showPercentages?: boolean
  layout?: 'horizontal' | 'vertical' | 'grid'
}

export function StatusSummary({ 
  statusCounts, 
  totalComplaints, 
  showPercentages = true,
  layout = 'horizontal'
}: StatusSummaryProps) {
  const getLayoutClasses = () => {
    switch (layout) {
      case 'vertical':
        return 'flex flex-col space-y-2'
      case 'grid':
        return 'grid grid-cols-2 gap-2'
      case 'horizontal':
      default:
        return 'flex flex-wrap gap-2'
    }
  }

  const getPercentage = (count: number) => {
    return totalComplaints > 0 ? Math.round((count / totalComplaints) * 100) : 0
  }

  const statusEntries = Object.entries(statusCounts) as [ComplaintStatus, number][]
  
  // Filter out statuses with 0 count
  const activeStatuses = statusEntries.filter(([_, count]) => count > 0)

  if (activeStatuses.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        No complaints found
      </div>
    )
  }

  return (
    <div className={getLayoutClasses()}>
      {activeStatuses.map(([status, count]) => (
        <div 
          key={status}
          className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3 min-w-0"
        >
          <div className="flex items-center space-x-2 min-w-0">
            <StatusBadge status={status} size="sm" />
            <span className="text-sm font-medium text-gray-900">{count}</span>
          </div>
          {showPercentages && (
            <span className="text-xs text-gray-500 ml-2">
              {getPercentage(count)}%
            </span>
          )}
        </div>
      ))}
    </div>
  )
}