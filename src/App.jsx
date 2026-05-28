import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Tanks from './pages/Tanks'
import PurchaseOrders from './pages/PurchaseOrders'
import Vendors from './pages/Vendors'
import FuelIssues from './pages/FuelIssues'
import Vehicles from './pages/Vehicles'
import Drivers from './pages/Drivers'
import DailyActivity from './pages/DailyActivity'
import ActivityTypes from './pages/ActivityTypes'
import Users from './pages/Users'
import Reports from './pages/Reports'

function PrivateRoute({ children }) {
  const { session, loading } = useAuth()
  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'#888'}}>Loading…</div>
  return session ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { session, loading } = useAuth()
  if (loading) return null
  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/tanks" element={<PrivateRoute><Tanks /></PrivateRoute>} />
      <Route path="/purchase-orders" element={<PrivateRoute><PurchaseOrders /></PrivateRoute>} />
      <Route path="/vendors" element={<PrivateRoute><Vendors /></PrivateRoute>} />
      <Route path="/fuel-issues" element={<PrivateRoute><FuelIssues /></PrivateRoute>} />
      <Route path="/vehicles" element={<PrivateRoute><Vehicles /></PrivateRoute>} />
      <Route path="/drivers" element={<PrivateRoute><Drivers /></PrivateRoute>} />
      <Route path="/daily-activity" element={<PrivateRoute><DailyActivity /></PrivateRoute>} />
      <Route path="/activity-types" element={<PrivateRoute><ActivityTypes /></PrivateRoute>} />
      <Route path="/users" element={<PrivateRoute><Users /></PrivateRoute>} />
      <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
      <Route path="*" element={<Navigate to={session ? '/dashboard' : '/login'} />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
