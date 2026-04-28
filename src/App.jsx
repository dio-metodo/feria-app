import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from './store/appStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import POS from './pages/pos/POS'
import Inventario from './pages/inventario/Inventario'
import Stock from './pages/stock/Stock'
import Asignaciones from './pages/asignaciones/Asignaciones'
import Precios from './pages/precios/Precios'
import Reportes from './pages/reportes/Reportes'
import Capital from './pages/capital/Capital'

function ProtectedRoute({ children }) {
  const { vendedoraActiva } = useAppStore()
  if (!vendedoraActiva) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { vendedoraActiva } = useAppStore()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={vendedoraActiva ? <Navigate to="/pos" replace /> : <Login />} />
        <Route path="/" element={<Navigate to={vendedoraActiva ? '/pos' : '/login'} replace />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          {/* Nested routes no funcionan bien con ProtectedRoute así, usamos wrapper */}
        </Route>
        <Route path="/pos" element={<ProtectedRoute><Layout><POS /></Layout></ProtectedRoute>} />
        <Route path="/inventario" element={<ProtectedRoute><Layout><Inventario /></Layout></ProtectedRoute>} />
        <Route path="/stock" element={<ProtectedRoute><Layout><Stock /></Layout></ProtectedRoute>} />
        <Route path="/asignaciones" element={<ProtectedRoute><Layout><Asignaciones /></Layout></ProtectedRoute>} />
        <Route path="/precios" element={<ProtectedRoute><Layout><Precios /></Layout></ProtectedRoute>} />
        <Route path="/reportes" element={<ProtectedRoute><Layout><Reportes /></Layout></ProtectedRoute>} />
        <Route path="/capital" element={<ProtectedRoute><Layout><Capital /></Layout></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
