import { useState, useEffect, useMemo } from 'react'
import { ShoppingCart, Plus, Minus, Trash2, CheckCircle, Search, X, ChevronDown } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { getProductos, getPrecios, createVenta, getVendedoras } from '../../lib/queries'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'

export default function POS() {
  const { productos, setProductos, precios, setPrecios, getPrecioProducto, vendedoraActiva, vendedoras, setVendedoras } = useAppStore()
  const [carrito, setCarrito] = useState([])
  const [search, setSearch] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [exitoOpen, setExitoOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [vendedoraVenta, setVendedoraVenta] = useState(vendedoraActiva?.id || '')
  const [descuentoGlobal, setDescuentoGlobal] = useState('')

  useEffect(() => {
    getProductos().then(({ data }) => { if (data) setProductos(data) })
    getPrecios().then(({ data }) => { if (data) setPrecios(data) })
    getVendedoras().then(({ data }) => { if (data) setVendedoras(data) })
  }, [])

  const tipos = useMemo(() => [...new Set(productos.map(p => p.tipo).filter(Boolean))], [productos])

  const productosFiltrados = productos
    .filter(p => p.stock_actual > 0)
    .filter(p => !tipoFiltro || p.tipo === tipoFiltro)
    .filter(p => !search || `${p.nombre} ${p.marca} ${p.presentacion}`.toLowerCase().includes(search.toLowerCase()))

  const addAlCarrito = (producto) => {
    const precio = getPrecioProducto(producto.id)
    setCarrito(prev => {
      const existente = prev.find(i => i.producto_id === producto.id)
      if (existente) {
        if (existente.cantidad >= producto.stock_actual) return prev
        return prev.map(i => i.producto_id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i)
      }
      return [...prev, {
        producto_id: producto.id,
        nombre: `${producto.nombre}${producto.presentacion ? ' ' + producto.presentacion : ''}`,
        precio_unitario: precio,
        cantidad: 1,
        stock_max: producto.stock_actual,
        descuento: 0,
      }]
    })
  }

  const updateCantidad = (id, delta) => {
    setCarrito(prev => prev.map(i => {
      if (i.producto_id !== id) return i
      const nueva = i.cantidad + delta
      if (nueva <= 0) return null
      if (nueva > i.stock_max) return i
      return { ...i, cantidad: nueva }
    }).filter(Boolean))
  }

  const removeItem = (id) => setCarrito(prev => prev.filter(i => i.producto_id !== id))

  const updatePrecio = (id, precio) => {
    setCarrito(prev => prev.map(i => i.producto_id === id ? { ...i, precio_unitario: parseFloat(precio) || 0 } : i))
  }

  const totalCarrito = carrito.reduce((s, i) => s + i.cantidad * i.precio_unitario, 0)
  const descuento = parseFloat(descuentoGlobal) || 0
  const totalFinal = totalCarrito - descuento

  const handleConfirmar = async () => {
    if (carrito.length === 0) return
    setSaving(true)
    for (const item of carrito) {
      await createVenta({
        producto_id: item.producto_id,
        vendedora_id: vendedoraVenta || vendedoraActiva?.id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        descuento: item.descuento || 0,
      })
    }
    // Actualizar stock local
    setProductos(productos.map(p => {
      const item = carrito.find(i => i.producto_id === p.id)
      return item ? { ...p, stock_actual: p.stock_actual - item.cantidad } : p
    }))
    setCarrito([])
    setDescuentoGlobal('')
    setSaving(false)
    setConfirmOpen(false)
    setExitoOpen(true)
    setTimeout(() => setExitoOpen(false), 2500)
  }

  const carritoCount = carrito.reduce((s, i) => s + i.cantidad, 0)

  return (
    <div className="flex flex-col min-h-0">
      {/* Barra de búsqueda y filtros */}
      <div className="px-4 pt-4 pb-2 bg-gray-50 sticky top-0 z-20">
        <div className="relative mb-2">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar producto..."
            className="w-full pl-9 pr-9 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X size={16} className="text-gray-400" />
            </button>
          )}
        </div>
        {/* Filtro por tipo */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setTipoFiltro('')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!tipoFiltro ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
          >
            Todos
          </button>
          {tipos.map(t => (
            <button
              key={t}
              onClick={() => setTipoFiltro(tipoFiltro === t ? '' : t)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${tipoFiltro === t ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de productos */}
      <div className="p-4 grid grid-cols-2 gap-3">
        {productosFiltrados.map(p => {
          const precio = getPrecioProducto(p.id)
          const enCarrito = carrito.find(i => i.producto_id === p.id)
          return (
            <button
              key={p.id}
              onClick={() => addAlCarrito(p)}
              className={`bg-white rounded-2xl p-4 text-left shadow-sm border transition-all active:scale-95 ${
                enCarrito ? 'border-green-400 shadow-green-100' : 'border-gray-100'
              }`}
            >
              <p className="font-semibold text-gray-900 text-sm leading-tight">{p.nombre}</p>
              {p.marca && <p className="text-xs text-gray-500 mt-0.5">{p.marca}</p>}
              {p.presentacion && <p className="text-xs text-gray-400">{p.presentacion}</p>}
              <div className="flex items-end justify-between mt-3">
                <div>
                  {precio > 0 ? (
                    <p className="text-green-600 font-bold text-base">S/ {precio.toFixed(2)}</p>
                  ) : (
                    <p className="text-amber-500 text-xs font-medium">Sin precio</p>
                  )}
                  <p className="text-xs text-gray-400">Stock: {p.stock_actual}</p>
                </div>
                {enCarrito && (
                  <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    {enCarrito.cantidad}
                  </span>
                )}
              </div>
            </button>
          )
        })}
        {productosFiltrados.length === 0 && (
          <div className="col-span-2 text-center py-12 text-gray-400">
            <p className="text-sm">Sin productos disponibles</p>
          </div>
        )}
      </div>

      {/* Carrito flotante */}
      {carrito.length > 0 && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 z-30">
          <button
            onClick={() => setConfirmOpen(true)}
            className="w-full bg-green-600 text-white rounded-2xl p-4 flex items-center justify-between shadow-xl active:scale-95 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="bg-green-500 rounded-full w-7 h-7 flex items-center justify-center font-bold text-sm">
                {carritoCount}
              </span>
              <span className="font-semibold">Ver carrito</span>
            </div>
            <span className="font-bold text-lg">S/ {totalCarrito.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Modal carrito/confirmación */}
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirmar venta">
        <div className="flex flex-col gap-3">
          {/* Vendedora */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Vendedora</label>
            <select
              value={vendedoraVenta}
              onChange={e => setVendedoraVenta(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {vendedoras.map(v => (
                <option key={v.id} value={v.id}>{v.nombre}</option>
              ))}
            </select>
          </div>

          {/* Items */}
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {carrito.map(item => (
              <div key={item.producto_id} className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900 flex-1">{item.nombre}</p>
                  <button onClick={() => removeItem(item.producto_id)}>
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateCantidad(item.producto_id, -1)}
                      className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center active:scale-90"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="font-bold text-base w-6 text-center">{item.cantidad}</span>
                    <button
                      onClick={() => updateCantidad(item.producto_id, 1)}
                      className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center active:scale-90"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">S/</span>
                    <input
                      type="number"
                      step="0.10"
                      value={item.precio_unitario}
                      onChange={e => updatePrecio(item.producto_id, e.target.value)}
                      className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                  <span className="font-semibold text-green-600 text-sm">
                    S/ {(item.cantidad * item.precio_unitario).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Descuento */}
          <div className="flex items-center gap-3 bg-amber-50 rounded-xl p-3">
            <label className="text-sm font-medium text-amber-700 shrink-0">Descuento (S/)</label>
            <input
              type="number"
              step="0.50"
              min="0"
              value={descuentoGlobal}
              onChange={e => setDescuentoGlobal(e.target.value)}
              placeholder="0.00"
              className="flex-1 border border-amber-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
            />
          </div>

          {/* Total */}
          <div className="bg-green-50 rounded-xl p-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Subtotal</span>
              <span>S/ {totalCarrito.toFixed(2)}</span>
            </div>
            {descuento > 0 && (
              <div className="flex justify-between text-sm text-red-500 mb-1">
                <span>Descuento</span>
                <span>-S/ {descuento.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-green-700 text-lg pt-2 border-t border-green-200">
              <span>Total</span>
              <span>S/ {totalFinal.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            <Button className="flex-1" size="lg" onClick={handleConfirmar} disabled={saving}>
              <CheckCircle size={18} />
              {saving ? 'Registrando...' : 'Confirmar venta'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast éxito */}
      {exitoOpen && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle size={18} />
          <span className="font-semibold">¡Venta registrada!</span>
        </div>
      )}
    </div>
  )
}
