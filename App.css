import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import BestSellers from './pages/BestSellers'
import Performance from './pages/Performance'
import SOH from './pages/SOH'
import Checklist from './pages/Checklist'
import Schedule from './pages/Schedule'
import KPI from './pages/KPI'
import Orders from './pages/Orders'
import Team from './pages/Team'

function ProtectedRoute({ children, roles }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen text-sm text-gray-400">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && profile && !roles.includes(profile.role)) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen text-sm" style={{color:'var(--t3)'}}>Loading KIKO Ops...</div>
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="best-sellers" element={<BestSellers />} />
        <Route path="performance" element={<Performance />} />
        <Route path="soh" element={<SOH />} />
        <Route path="checklist" element={<Checklist />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="kpi" element={<KPI />} />
        <Route path="orders" element={<Orders />} />
        <Route path="team" element={<ProtectedRoute roles={['admin','area_manager']}><Team /></ProtectedRoute>} />
      </Route>
    </Routes>
  )
}
