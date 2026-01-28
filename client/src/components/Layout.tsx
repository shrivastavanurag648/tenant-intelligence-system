import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Building2, FileText, Home, Plus } from 'lucide-react'
import { Breadcrumb } from './Breadcrumb'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Submit Complaint', href: '/submit', icon: Plus },
    { name: 'View Complaints', href: '/complaints', icon: FileText },
  ]

  const showBreadcrumbs = location.pathname !== '/'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex items-center px-4 text-lg font-semibold text-gray-900 transition-smooth hover:text-primary-600">
                <Building2 className="h-6 w-6 mr-2 text-primary-600" />
                Tenant Intelligence
              </Link>
            </div>
            
            <div className="flex space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.href
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-smooth ${
                      isActive
                        ? 'border-primary-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-1" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Breadcrumbs */}
      {showBreadcrumbs && (
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <Breadcrumb />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">
              Tenant Intelligence System - Demo Version 1.0.0
            </p>
            <p className="text-xs text-gray-400">
              Built for hackathon demonstration • Anonymous complaint tracking • Community verification
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}