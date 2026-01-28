import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  ChevronUp, 
  ChevronDown, 
  Calendar, 
  MapPin, 
  User, 
  Camera, 
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Complaint, 
  Evidence, 
  IssueCategory, 
  ComplaintStatus,
  StatusHistory 
} from '../../../shared/src/types'
import { 
  getComplaint, 
  upvoteComplaint, 
  removeUpvote, 
  getUpvoteStatus,
  submitEvidence,
  getEvidence,
  getStatusHistory,
  formatDate,
  formatRelativeTime,
  getImageUrl
} from '../services/api'
import ImageViewer from '../components/ImageViewer'
import ImageGallery from '../components/ImageGallery'
import { StatusBadge } from '../components/StatusBadge'
import { TimestampDisplay } from '../components/TimestampDisplay'
import { StatusHistoryViewer } from '../components/StatusHistoryViewer'

const EvidenceFormSchema = z.object({
  description: z.string().min(5, 'Description must be at least 5 characters').max(1000)
})

type EvidenceFormData = z.infer<typeof EvidenceFormSchema>

export function ComplaintDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasUpvoted, setHasUpvoted] = useState(false)
  const [upvoting, setUpvoting] = useState(false)
  const [showEvidenceForm, setShowEvidenceForm] = useState(false)
  const [submittingEvidence, setSubmittingEvidence] = useState(false)
  const [evidenceImage, setEvidenceImage] = useState<File | null>(null)
  const [evidenceImagePreview, setEvidenceImagePreview] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid }
  } = useForm<EvidenceFormData>({
    resolver: zodResolver(EvidenceFormSchema),
    mode: 'onChange'
  })

  useEffect(() => {
    if (id) {
      loadComplaintData()
    }
  }, [id])

  const loadComplaintData = async () => {
    if (!id) return

    try {
      setLoading(true)
      setError(null)

      // Load complaint, evidence, upvote status, and status history in parallel
      const [complaintData, evidenceData, upvoteStatus, historyData] = await Promise.all([
        getComplaint(id),
        getEvidence(id).catch(() => []), // Don't fail if evidence endpoint doesn't exist
        getUpvoteStatus(id).catch(() => false),
        getStatusHistory(id).catch(() => [])
      ])

      setComplaint(complaintData)
      setEvidence(evidenceData)
      setHasUpvoted(upvoteStatus)
      setStatusHistory(historyData)
    } catch (err) {
      console.error('Error loading complaint:', err)
      setError(err instanceof Error ? err.message : 'Failed to load complaint')
    } finally {
      setLoading(false)
    }
  }

  const handleUpvote = async () => {
    if (!complaint || upvoting) return

    try {
      setUpvoting(true)
      
      if (hasUpvoted) {
        const updatedComplaint = await removeUpvote(complaint.id)
        setComplaint(updatedComplaint)
        setHasUpvoted(false)
      } else {
        const updatedComplaint = await upvoteComplaint(complaint.id)
        setComplaint(updatedComplaint)
        setHasUpvoted(true)
      }
    } catch (err) {
      console.error('Error updating upvote:', err)
      // Show error but don't update UI state
    } finally {
      setUpvoting(false)
    }
  }

  const handleEvidenceImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Only JPEG, PNG, and WebP images are allowed')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB')
      return
    }

    setEvidenceImage(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setEvidenceImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeEvidenceImage = () => {
    setEvidenceImage(null)
    setEvidenceImagePreview(null)
  }

  const onSubmitEvidence = async (data: EvidenceFormData) => {
    if (!complaint) return

    try {
      setSubmittingEvidence(true)
      
      const newEvidence = await submitEvidence(
        complaint.id,
        data.description,
        evidenceImage || undefined
      )
      
      setEvidence(prev => [...prev, newEvidence])
      setShowEvidenceForm(false)
      reset()
      removeEvidenceImage()
    } catch (err) {
      console.error('Error submitting evidence:', err)
      alert(err instanceof Error ? err.message : 'Failed to submit evidence')
    } finally {
      setSubmittingEvidence(false)
    }
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Link to="/complaints" className="btn-secondary mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600">Loading complaint...</span>
        </div>
      </div>
    )
  }

  if (error || !complaint) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Link to="/complaints" className="btn-secondary mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </div>
        <div className="card bg-red-50 border-red-200 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-900 mb-2">Complaint Not Found</h3>
          <p className="text-red-700 mb-4">
            {error || 'The complaint you are looking for does not exist or has been removed.'}
          </p>
          <Link to="/complaints" className="btn-primary">
            View All Complaints
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to="/complaints" className="btn-secondary">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Complaints
        </Link>
        <div className="text-sm text-gray-500">
          ID: {complaint.id.substring(0, 8)}...
        </div>
      </div>

      {/* Main Complaint Card */}
      <div className="card">
        {/* Header with badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className={getCategoryBadgeClass(complaint.category)}>
            {complaint.category}
          </span>
          <StatusBadge status={complaint.status} showIcon={true} />
          {complaint.imageUrl && (
            <span className="badge bg-blue-100 text-blue-800">
              📷 Photo Evidence
            </span>
          )}
        </div>

        {/* Description */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Complaint Details</h1>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {complaint.description}
          </p>
        </div>

        {/* Image */}
        {complaint.imageUrl && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Photo Evidence</h3>
            <ImageViewer
              src={complaint.imageUrl}
              alt="Complaint evidence"
              caption="Original complaint photo"
              maxWidth="100%"
              maxHeight="500px"
            />
          </div>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-3">
            <div className="flex items-center text-gray-600">
              <MapPin className="h-5 w-5 mr-2" />
              <div>
                <span className="text-sm text-gray-500">Building Address</span>
                <p className="font-medium text-gray-900">{complaint.buildingAddress}</p>
              </div>
            </div>
            
            {complaint.landlordInfo && (
              <div className="flex items-center text-gray-600">
                <User className="h-5 w-5 mr-2" />
                <div>
                  <span className="text-sm text-gray-500">Landlord</span>
                  <p className="font-medium text-gray-900">{complaint.landlordInfo.name}</p>
                  {complaint.landlordInfo.contactInfo && (
                    <p className="text-sm text-gray-600">{complaint.landlordInfo.contactInfo}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <TimestampDisplay 
              date={complaint.createdAt}
              label="Submitted"
              format="both"
            />

            <TimestampDisplay 
              date={complaint.updatedAt}
              label="Last Updated"
              format="both"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          {/* Upvote Button */}
          <button
            onClick={handleUpvote}
            disabled={upvoting}
            className={`flex items-center px-4 py-2 rounded-md transition-colors ${
              hasUpvoted
                ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } ${upvoting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {hasUpvoted ? (
              <ChevronDown className="h-5 w-5 mr-2" />
            ) : (
              <ChevronUp className="h-5 w-5 mr-2" />
            )}
            {upvoting ? 'Updating...' : hasUpvoted ? 'Remove Upvote' : 'Upvote'}
            <span className="ml-2 font-medium">({complaint.upvotes})</span>
          </button>

          {/* Add Evidence Button */}
          <button
            onClick={() => setShowEvidenceForm(!showEvidenceForm)}
            className="btn-secondary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Evidence
          </button>
        </div>
      </div>

      {/* Evidence Submission Form */}
      {showEvidenceForm && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Submit Supporting Evidence</h3>
          
          <form onSubmit={handleSubmit(onSubmitEvidence)} className="space-y-4">
            {/* Description */}
            <div>
              <label htmlFor="evidenceDescription" className="form-label">
                Description *
              </label>
              <textarea
                {...register('description')}
                id="evidenceDescription"
                rows={4}
                placeholder="Describe your supporting evidence..."
                className={`form-textarea ${errors.description ? 'border-red-300' : ''}`}
              />
              {errors.description && (
                <p className="form-error">{errors.description.message}</p>
              )}
            </div>

            {/* Image Upload */}
            <div>
              <label className="form-label">Photo Evidence (Optional)</label>
              
              {!evidenceImagePreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleEvidenceImageUpload}
                    className="hidden"
                    id="evidence-image-upload"
                  />
                  <label htmlFor="evidence-image-upload" className="cursor-pointer">
                    <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Click to upload an image</p>
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={evidenceImagePreview}
                    alt="Evidence preview"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeEvidenceImage}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowEvidenceForm(false)
                  reset()
                  removeEvidenceImage()
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValid || submittingEvidence}
                className={`btn-primary ${(!isValid || submittingEvidence) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {submittingEvidence ? 'Submitting...' : 'Submit Evidence'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Evidence List */}
      {evidence.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Supporting Evidence ({evidence.length})
          </h3>
          
          {/* Evidence Images Gallery */}
          {evidence.some(item => item.imageUrl) && (
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-700 mb-3">Evidence Photos</h4>
              <ImageGallery
                images={evidence
                  .filter(item => item.imageUrl)
                  .map(item => ({
                    url: item.imageUrl!,
                    alt: 'Evidence photo',
                    caption: item.description.length > 50 
                      ? `${item.description.substring(0, 50)}...` 
                      : item.description
                  }))
                }
                className="mb-4"
              />
            </div>
          )}
          
          {/* Evidence List */}
          <div className="space-y-4">
            {evidence.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <p className="text-gray-700 mb-2">{item.description}</p>
                
                {item.imageUrl && (
                  <div className="mb-2">
                    <ImageViewer
                      src={item.imageUrl}
                      alt="Evidence photo"
                      caption={`Evidence: ${item.description}`}
                      maxWidth="300px"
                      maxHeight="200px"
                    />
                  </div>
                )}
                
                <p className="text-sm text-gray-500">
                  Submitted {formatRelativeTime(item.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status History */}
      {statusHistory.length > 0 && (
        <StatusHistoryViewer 
          history={statusHistory}
          title="Status History"
          defaultExpanded={false}
        />
      )}
    </div>
  )
}