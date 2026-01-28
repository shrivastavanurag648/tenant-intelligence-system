import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, ChevronUp, Calendar, MapPin, User, Eye } from 'lucide-react'
import { Complaint, ComplaintFilters, IssueCategory, ComplaintStatus } from '../../../shared/src/types'
import { getComplaints, formatRelativeTime } from '../services/api'
import { StatusBadge } from '../components/StatusBadge'
import { TimestampDisplay } from '../components/TimestampDisplay'
import { LoadingSpinner, LoadingCard } from '../components/LoadingSpinner'
import { ErrorMessage } from '../components/ErrorBoundary'

export function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<ComplaintFilters>({
    limit: 20,
    offset: 0
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'upvotes'>('newest')

  // Load complaints
  useEffect(() => {
    loadComplaints()
  }, [filters, sortBy])

  const loadComplaints = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await getComplaints(filters)
      let complaintsData = response.data

      // Apply client-side sorting since API doesn't support it yet
      if (sortBy === 'newest') {
        complaintsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      } else if (sortBy === 'oldest') {
        complaintsData.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      } else if (sortBy === 'upvotes') {
        complaintsData.sort((a, b) => b.upvotes - a.upvotes)
      }

      // Apply client-side search filter
      if (searchTerm) {
        complaintsData = complaintsData.filter(complaint =>
          complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          complaint.buildingAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
          complaint.category.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      setComplaints(complaintsData)
    } catch (err) {
      console.error('Error loading complaints:', err)
      setError(err instanceof Error ? err.message : 'Failed to load complaints')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: keyof ComplaintFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: 0 // Reset to first page when filters change
    }))
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadComplaints()
  }

  const getCategoryBadgeClass = (category: IssueCategory) => {
    switch (category) {
      case IssueCategory.SAFETY:
        return 'badge-safety'
      case IssueCategory.MAINTENANCE:
        return 'badge-maintenance'
      case IssueCategory.SANITATION:
        return 'badge-sanitation'
      case IssueCategory.UTILITIES:
        return 'badge-utilities'
      default:
        return 'badge bg-gray-100 text-gray-800'
    }
  }

  const getStatusBadgeClass = (status: ComplaintStatus) => {
    switch (status) {
      case ComplaintStatus.REPORTED:
        return 'badge-reported'
      case ComplaintStatus.UNDER_REVIEW:
        return 'badge-under-review'
      case ComplaintStatus.RESOLVED:
        return 'badge-resolved'
      case ComplaintStatus.DISMISSED:
        return 'badge-dismissed'
      default:
        return 'badge bg-gray-100 text-gray-800'
    }
  }

  if (loading && complaints.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">All Complaints</h1>
        <LoadingCard 
          title="Loading complaints..." 
          message="Fetching the latest community reports"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-gray-900">All Complaints</h1>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <Link
            to="/submit"
            className="btn-primary"
          >
            Submit Complaint
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search complaints by description, address, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'} flex items-center`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                Search
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="border-t pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div>
                <label className="form-label">Category</label>
                <select
                  value={filters.category || ''}
                  onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                  className="form-select"
                >
                  <option value="">All Categories</option>
                  {Object.values(IssueCategory).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="form-label">Status</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                  className="form-select"
                >
                  <option value="">All Statuses</option>
                  {Object.values(ComplaintStatus).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {/* Building Address Filter */}
              <div>
                <label className="form-label">Building Address</label>
                <input
                  type="text"
                  placeholder="Enter address"
                  value={filters.buildingAddress || ''}
                  onChange={(e) => handleFilterChange('buildingAddress', e.target.value || undefined)}
                  className="form-input"
                />
              </div>

              {/* Sort By */}
              <div>
                <label className="form-label">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'upvotes')}
                  className="form-select"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="upvotes">Most Upvoted</option>
                </select>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Error Display */}
      {error && (
        <ErrorMessage 
          title="Failed to load complaints"
          message={error}
          onRetry={loadComplaints}
        />
      )}

      {/* Results Summary */}
      {!loading && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {complaints.length} complaint{complaints.length !== 1 ? 's' : ''} found
          </span>
          {searchTerm && (
            <span>
              Searching for: <strong>"{searchTerm}"</strong>
            </span>
          )}
        </div>
      )}

      {/* Complaints List */}
      {complaints.length === 0 && !loading ? (
        <div className="card text-center py-12">
          <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No complaints found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || Object.keys(filters).some(key => filters[key as keyof ComplaintFilters])
              ? 'Try adjusting your search or filters'
              : 'Be the first to submit a complaint'}
          </p>
          <Link to="/submit" className="btn-primary">
            Submit First Complaint
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map((complaint) => (
            <Link
              key={complaint.id}
              to={`/complaints/${complaint.id}`}
              className="card hover:shadow-md transition-shadow block"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Header with badges */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className={getCategoryBadgeClass(complaint.category)}>
                      {complaint.category}
                    </span>
                    <StatusBadge status={complaint.status} size="sm" />
                    {complaint.imageUrl && (
                      <span className="badge bg-blue-100 text-blue-800">
                        📷 Photo
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-gray-900 font-medium mb-2 line-clamp-2">
                    {complaint.description.length > 150
                      ? `${complaint.description.substring(0, 150)}...`
                      : complaint.description
                    }
                  </p>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {complaint.buildingAddress}
                    </div>
                    <TimestampDisplay 
                      date={complaint.createdAt}
                      format="relative"
                      size="sm"
                      showIcon={true}
                    />
                    {complaint.landlordInfo && (
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {complaint.landlordInfo.name}
                      </div>
                    )}
                  </div>
                </div>

                {/* Upvotes */}
                <div className="flex-shrink-0 ml-4 text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-gray-50 rounded-full">
                    <div className="text-center">
                      <ChevronUp className="h-5 w-5 text-gray-600 mx-auto" />
                      <span className="text-xs font-medium text-gray-600">
                        {complaint.upvotes}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Evidence count */}
              {complaint.evidence && complaint.evidence.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="text-sm text-gray-600">
                    {complaint.evidence.length} piece{complaint.evidence.length !== 1 ? 's' : ''} of supporting evidence
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Load More (if needed) */}
      {complaints.length >= (filters.limit || 20) && (
        <div className="text-center">
          <button
            onClick={() => handleFilterChange('limit', (filters.limit || 20) + 20)}
            className="btn-secondary flex items-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}
    </div>
  )
}