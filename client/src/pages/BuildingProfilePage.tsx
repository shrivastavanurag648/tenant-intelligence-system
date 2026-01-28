import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { BuildingProfile, Complaint, IssueCategory, ComplaintStatus } from '../../../shared/src/types'
import { getBuildingProfile, formatDate, formatRelativeTime } from '../services/api'
import ImageViewer from '../components/ImageViewer'
import { StatusBadge } from '../components/StatusBadge'
import { TimestampDisplay } from '../components/TimestampDisplay'
import { StatusSummary } from '../components/StatusSummary'

interface ChartData {
  label: string
  value: number
  color: string
}

function PieChart({ data, title }: { data: ChartData[], title: string }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  
  if (total === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <p className="text-gray-500">No data available</p>
      </div>
    )
  }

  let cumulativePercentage = 0

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="flex items-center space-x-6">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100
              const strokeDasharray = `${percentage} ${100 - percentage}`
              const strokeDashoffset = -cumulativePercentage
              cumulativePercentage += percentage
              
              return (
                <circle
                  key={index}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth="8"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-300"
                />
              )
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-700">{total}</span>
          </div>
        </div>
        <div className="flex-1">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-600">{item.label}</span>
              </div>
              <span className="text-sm font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function BarChart({ data, title }: { data: ChartData[], title: string }) {
  const maxValue = Math.max(...data.map(item => item.value))
  
  if (maxValue === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <p className="text-gray-500">No data available</p>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center">
            <div className="w-24 text-sm text-gray-600 truncate">{item.label}</div>
            <div className="flex-1 mx-3">
              <div className="bg-gray-200 rounded-full h-4 relative">
                <div
                  className="h-4 rounded-full transition-all duration-300"
                  style={{
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color
                  }}
                />
              </div>
            </div>
            <div className="w-12 text-sm font-medium text-right">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function BuildingProfilePage() {
  const { address } = useParams<{ address: string }>()
  const [profile, setProfile] = useState<BuildingProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProfile() {
      if (!address) {
        setError('Building address is required')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const profileData = await getBuildingProfile(decodeURIComponent(address))
        setProfile(profileData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load building profile')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [address])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Profile</h2>
          <p className="text-red-600">{error}</p>
          <Link to="/" className="inline-block mt-4 text-blue-600 hover:text-blue-800">
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Profile Not Found</h2>
          <p className="text-gray-600">No profile data available for this building.</p>
          <Link to="/" className="inline-block mt-4 text-blue-600 hover:text-blue-800">
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  // Prepare chart data
  const categoryData: ChartData[] = Object.entries(profile.complaintsByCategory).map(([category, count]) => ({
    label: category,
    value: count,
    color: getCategoryColor(category as IssueCategory)
  }))

  const statusData: ChartData[] = Object.entries(profile.complaintsByStatus).map(([status, count]) => ({
    label: status,
    value: count,
    color: getStatusColor(status as ComplaintStatus)
  }))

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <Link to="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
          ← Back to Home
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Building Profile</h1>
        <p className="text-xl text-gray-600">{profile.address}</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Complaints</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{profile.totalComplaints}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Avg Resolution Time</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {profile.averageResolutionTime > 0 ? `${Math.round(profile.averageResolutionTime)} days` : 'N/A'}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Resolved</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {profile.complaintsByStatus[ComplaintStatus.RESOLVED] || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Pending</h3>
          <p className="text-3xl font-bold text-orange-600 mt-2">
            {(profile.complaintsByStatus[ComplaintStatus.REPORTED] || 0) + 
             (profile.complaintsByStatus[ComplaintStatus.UNDER_REVIEW] || 0)}
          </p>
        </div>
      </div>

      {/* Status Summary */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h3 className="text-lg font-semibold mb-4">Current Status Overview</h3>
        <StatusSummary 
          statusCounts={profile.complaintsByStatus}
          totalComplaints={profile.totalComplaints}
          layout="grid"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <PieChart data={categoryData} title="Complaints by Category" />
        <BarChart data={statusData} title="Complaints by Status" />
      </div>

      {/* Landlord Info */}
      {profile.landlordInfo && (
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-lg font-semibold mb-4">Landlord Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-500">Name:</span>
              <p className="text-gray-900">{profile.landlordInfo.name}</p>
            </div>
            {profile.landlordInfo.contactInfo && (
              <div>
                <span className="text-sm font-medium text-gray-500">Contact:</span>
                <p className="text-gray-900">{profile.landlordInfo.contactInfo}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Complaints */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Recent Complaints</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {profile.recentComplaints.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No recent complaints found
            </div>
          ) : (
            profile.recentComplaints.map((complaint) => (
              <div key={complaint.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryBadgeClass(complaint.category)}`}>
                        {complaint.category}
                      </span>
                      <StatusBadge status={complaint.status} size="sm" />
                    </div>
                    <p className="text-gray-900 mb-2 line-clamp-2">{complaint.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <TimestampDisplay 
                        date={complaint.createdAt}
                        format="relative"
                        size="sm"
                        showIcon={false}
                      />
                      <span>{complaint.upvotes} upvotes</span>
                      {complaint.evidence.length > 0 && (
                        <span>{complaint.evidence.length} evidence</span>
                      )}
                    </div>
                  </div>
                  {complaint.imageUrl && (
                    <div className="ml-4">
                      <ImageViewer
                        src={complaint.imageUrl}
                        alt="Complaint evidence"
                        caption="Evidence photo"
                        maxWidth="64px"
                        maxHeight="64px"
                        showCaption={false}
                        className="w-16 h-16"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// Helper functions for styling
function getCategoryColor(category: IssueCategory): string {
  switch (category) {
    case IssueCategory.SAFETY: return '#ef4444'
    case IssueCategory.MAINTENANCE: return '#f59e0b'
    case IssueCategory.SANITATION: return '#10b981'
    case IssueCategory.UTILITIES: return '#3b82f6'
    default: return '#6b7280'
  }
}

function getStatusColor(status: ComplaintStatus): string {
  switch (status) {
    case ComplaintStatus.REPORTED: return '#f59e0b'
    case ComplaintStatus.UNDER_REVIEW: return '#3b82f6'
    case ComplaintStatus.RESOLVED: return '#10b981'
    case ComplaintStatus.DISMISSED: return '#6b7280'
    default: return '#6b7280'
  }
}

function getCategoryBadgeClass(category: IssueCategory): string {
  switch (category) {
    case IssueCategory.SAFETY: return 'bg-red-100 text-red-800'
    case IssueCategory.MAINTENANCE: return 'bg-yellow-100 text-yellow-800'
    case IssueCategory.SANITATION: return 'bg-green-100 text-green-800'
    case IssueCategory.UTILITIES: return 'bg-blue-100 text-blue-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getStatusBadgeClass(status: ComplaintStatus): string {
  switch (status) {
    case ComplaintStatus.REPORTED: return 'bg-yellow-100 text-yellow-800'
    case ComplaintStatus.UNDER_REVIEW: return 'bg-blue-100 text-blue-800'
    case ComplaintStatus.RESOLVED: return 'bg-green-100 text-green-800'
    case ComplaintStatus.DISMISSED: return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}