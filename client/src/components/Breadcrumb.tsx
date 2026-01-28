import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  const location = useLocation()
  
  // Auto-generate breadcrumbs if not provided
  const breadcrumbItems = items || generateBreadcrumbs(location.pathname)

  if (breadcrumbItems.length <= 1) {
    return null
  }

  return (
    <nav className={`flex items-center space-x-2 text-sm text-gray-500 ${className}`}>
      <Link 
        to="/" 
        className="flex items-center hover:text-gray-700 transition-colors"
      >
        <Home className="h-4 w-4" />
        <span className="sr-only">Home</span>
      </Link>
      
      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4" />
          {item.href && index < breadcrumbItems.length - 1 ? (
            <Link 
              to={item.href}
              className="hover:text-gray-700 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  )
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = []

  segments.forEach((segment, index) => {
    const path = '/' + segments.slice(0, index + 1).join('/')
    const isLast = index === segments.length - 1

    let label = segment
    
    // Customize labels for known routes
    switch (segment) {
      case 'complaints':
        label = 'Complaints'
        break
      case 'submit':
        label = 'Submit Complaint'
        break
      case 'buildings':
        label = 'Building Profiles'
        break
      case 'landlords':
        label = 'Landlord Profiles'
        break
      default:
        // For dynamic segments (like IDs), try to make them more readable
        if (segment.length > 10 && segment.includes('-')) {
          label = 'Details'
        } else {
          label = segment.charAt(0).toUpperCase() + segment.slice(1)
        }
    }

    breadcrumbs.push({
      label,
      href: isLast ? undefined : path
    })
  })

  return breadcrumbs
}