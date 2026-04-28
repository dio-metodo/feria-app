import { NavLink, useLocation } from 'react-router-dom'
import { ShoppingCart, Package, BarChart3, Users, Tag, Layers, Wallet, LogOut } from 'lucide-react'
import { useAppStore } from '../store/appStore'

const tabs = [
  { to: '/pos', icon: ShoppingCart, label: 'Vender' },
  { to: '/inventario', icon: Package, label: 'Stock' },
  { to: '/asignaciones', icon: Users, label: 'Asignar' },
  { to: '/reportes', icon: BarChart3, label: 'Reporte' },
  { to: '/capital', icon: Wallet, label: 'Capital' },
]

export default function Layout({ children }) {
  const { vendedoraActiva, logout } = useAppStore()
  const location = useLocation()

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50">
      {/* Header */}
      <header className="bg-green-600 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div>
          <h1 className="font-bold text-base leading-tight">FeriaApp</h1>
          {vendedoraActiva && (
            <p className="text-green-100 text-xs">{vendedoraActiva.nombre}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <NavLink to="/precios" className={({ isActive }) =>
            `p-2 rounded-full ${isActive ? 'bg-green-700' : 'hover:bg-green-700'}`
          }>
            <Tag size={18} />
          </NavLink>
          <NavLink to="/stock" className={({ isActive }) =>
            `p-2 rounded-full ${isActive ? 'bg-green-700' : 'hover:bg-green-700'}`
          }>
            <Layers size={18} />
          </NavLink>
          <button onClick={logout} className="p-2 rounded-full hover:bg-green-700">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Tab bar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-100 flex z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-colors ${
                isActive ? 'text-green-600' : 'text-gray-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
