import { useState, useEffect } from 'react'
import { Tag, Edit2, Check, X, TrendingUp } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { getProductos, getPrecios, setprecio } from '../../lib/queries'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'

export default function Precios() {
  const { productos, setProductos, precios, setPrecios, getPrecioProducto } = useAppStore()
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getProductos().then(({ data }) => { if (data) setProductos(data) })
    getPrecios().then(({ data }) => { if (data) setPrecios(data) })
  }, [])

  const startEdit = (p) => {
    setEditingId(p.id)
    setEditValue(getPrecioProducto(p.id).toString() || '')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValue('')
  }

  const handleSave = async (p) => {
    const precio = parseFloat(editValue)
    if (!precio || precio <= 0) return
    setSaving(true)
    const { data, error } = await setprecio(p.id, precio)
    if (!error && data) {
      setPrecios([data, ...precios])
    }
    setSaving(false)
    setEditingId(null)
    setEditValue('')
  }

  const getMargen = (producto) => {
    const precio = getPrecioProducto(producto.id)
    if (!precio || precio <= producto.costo_unitario) return null
    return ((precio - producto.costo_unitario) / precio * 100).toFixed(0)
  }

  const productosOrdenados = [...productos].sort((a, b) => {
    const pa = getPrecioProducto(a.id)
    const pb = getPrecioProducto(b.id)
    if (!pa && pb) return 1
    if (pa && !pb) return -1
    return 0
  })

  const sinPrecio = productosOrdenados.filter(p => !getPrecioProducto(p.id))
  const conPrecio = productosOrdenados.filter(p => getPrecioProducto(p.id) > 0)

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Tag size={20} className="text-green-600" />
        <h2 className="font-bold text-gray-900 text-base">Precios de venta</h2>
      </div>

      {sinPrecio.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-4">
          <p className="text-amber-700 text-sm font-medium">{sinPrecio.length} producto{sinPrecio.length > 1 ? 's' : ''} sin precio</p>
        </div>
      )}

      {/* Productos sin precio */}
      {sinPrecio.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">Sin precio</h3>
          <div className="flex flex-col gap-2">
            {sinPrecio.map(p => (
              <PrecioRow key={p.id} p={p} precio={0} editingId={editingId} editValue={editValue} setEditValue={setEditValue} saving={saving} startEdit={startEdit} cancelEdit={cancelEdit} handleSave={handleSave} margen={null} />
            ))}
          </div>
        </div>
      )}

      {/* Productos con precio */}
      {conPrecio.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">Con precio</h3>
          <div className="flex flex-col gap-2">
            {conPrecio.map(p => (
              <PrecioRow key={p.id} p={p} precio={getPrecioProducto(p.id)} editingId={editingId} editValue={editValue} setEditValue={setEditValue} saving={saving} startEdit={startEdit} cancelEdit={cancelEdit} handleSave={handleSave} margen={getMargen(p)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PrecioRow({ p, precio, editingId, editValue, setEditValue, saving, startEdit, cancelEdit, handleSave, margen }) {
  const isEditing = editingId === p.id
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">{p.nombre}</p>
          <p className="text-xs text-gray-500">{p.marca} · {p.presentacion}</p>
          <p className="text-xs text-gray-400 mt-0.5">Costo: S/ {p.costo_unitario?.toFixed(2)}</p>
        </div>

        {isEditing ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border border-green-300 rounded-xl px-2 py-1">
              <span className="text-xs text-gray-500">S/</span>
              <input
                type="number"
                step="0.10"
                min="0"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                className="w-16 text-sm font-bold text-gray-900 focus:outline-none text-right"
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleSave(p); if (e.key === 'Escape') cancelEdit() }}
              />
            </div>
            <button onClick={() => handleSave(p)} disabled={saving} className="p-1.5 bg-green-600 text-white rounded-full">
              <Check size={14} />
            </button>
            <button onClick={cancelEdit} className="p-1.5 bg-gray-200 rounded-full">
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="text-right">
              {precio > 0 ? (
                <>
                  <p className="font-bold text-green-600 text-base">S/ {precio.toFixed(2)}</p>
                  {margen && (
                    <div className="flex items-center justify-end gap-0.5 text-xs text-amber-600">
                      <TrendingUp size={10} />
                      <span>+{margen}%</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-amber-500 text-sm font-medium">Sin precio</p>
              )}
            </div>
            <button
              onClick={() => startEdit(p)}
              className="p-2 rounded-xl hover:bg-gray-100"
            >
              <Edit2 size={16} className="text-gray-400" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
