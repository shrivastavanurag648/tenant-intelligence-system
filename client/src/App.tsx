import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { SubmitComplaintPage } from './pages/SubmitComplaintPage'
import { ComplaintsPage } from './pages/ComplaintsPage'
import { ComplaintDetailPage } from './pages/ComplaintDetailPage'
import { BuildingProfilePage } from './pages/BuildingProfilePage'
import { LandlordProfilePage } from './pages/LandlordProfilePage'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastContainer, useToast } from './components/Toast'

function App() {
  const { toasts, removeToast } = useToast()

  return (
    <ErrorBoundary>
      <Layout>
        <div className="page-transition">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/submit" element={<SubmitComplaintPage />} />
            <Route path="/complaints" element={<ComplaintsPage />} />
            <Route path="/complaints/:id" element={<ComplaintDetailPage />} />
            <Route path="/buildings/:address" element={<BuildingProfilePage />} />
            <Route path="/landlords/:id" element={<LandlordProfilePage />} />
          </Routes>
        </div>
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </Layout>
    </ErrorBoundary>
  )
}

export default App