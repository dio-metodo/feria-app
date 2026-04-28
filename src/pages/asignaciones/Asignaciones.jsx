import { useState, useEffect } from 'react'
import { Users, PackageCheck, RotateCcw, Plus } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { getProductos, getVendedoras, getAsignaciones, upsertAsignacion, registrarDevolucion } from '../../lib/queries'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { Select } from '../../components/ui/Input'

const COLORES = { '#16a34a': 'bg-green-100 text-green-800', '#2563eb': 'bg-blue-100 text-blue-800', '#9333ea': 'bg-purple-100 text-purple-800' }

export default function Asignaciones() {
  const { productos, setProductos, vendedoras, setVendedoras } = useAppStore()
  const [asignaciones, setAsignaciones] = useState([])
  const [ventas, setVentas] = useState([])
  const [asignarOpen, setAsignarOpen] = useState(false)
  const [devolverOpen, setDevolverOpen] = useState(false)
  const [selectedAsig, setSelectedAsig] = useState(null)
  const [filtroVendedora, setFiltroVendedora] = useState('')
  const [form, setForm] = useState({ producto_id: '', vendedora_id: '', cantidad: '' })
  const [devolucion, setDevolucion] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getProductos().then(({ data }) => { if (data) setProductos(data) })
    getVendedoras().then(({ data }) => { if (data) setVendedoras(data) })
    loadAsignaciones()
  }, [])

  const loadAsignaciones = async () => {
    const { data } = await getAsignaciones()
    if (data) setAsignaciones(data)
  }

  const getVentasProductoVendedora = async () => {
    // Calcular vendido por asignación usando datos de ventas locales
  }

  const handleAsignar = async () => {
    if (!form.producto_id || !form.vendedora_id || !form.cantidad) return
    setSaving(true)
    const { data, error } = await upsertAsignacion(form.producto_id, form.vendedora_id, parseInt(form.cantidad))
    if (!error) loadAsignaciones()
    setSaving(false)
    setAsignarOpen(false)
  }

  const handleDevolucion = async () => {
    if (!devolucion || !selectedAsig) return
    setSaving(true)
    await registrarDevolucion(selectedAsig.id, parseInt(devolucion))
    loadAsignaciones()
    setSaving(false)
    setDevolverOpen(false)
    setDevolucion('')
  }

  const openDevolucion = (asig) => {
    setSelectedAsig(asig)
    setDevolucion(asig.cantidad_devuelta?.toString() || '')
    setDevolverOpen(true)
  }

  const asignacionesFiltradas = filtroVendedora
    ? asignaciones.filter(a => a.vendedora_id === filtroVendedora)
    : asignaciones

  // Agrupar por vendedora
  const porVendedora = vendedoras.map(v => ({
    vendedora: v,
    items: asignacionesFiltradas.filter(a => a.vendedora_id === v.id)
  })).filter(g => !filtroVendedora || g.vendedora.id === filtroVendedora)

  const colorClass = (color) => COLORES[color] || 'bg-gray-100 text-gray-800'

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900 text-base">Asignaciones</h2>
        <Button onClick={() => { setForm({ producto_id: '', vendedora_id: '', cantidad: '' }); setAsignarOpen(true) }} size="sm">
          <Plus size={16} /> Asignar
        </Button>
      </div>

      {/* Filtro vendedora */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        <button
          onClick={() => setFiltroVendedora('')}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${!filtroVendedora ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
        >
          Todas
        </button>
        {vendedoras.map(v => (
          <button
            key={v.id}
            onClick={() => setFiltroVendedora(v.id === filtroVendedora ? '' : v.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${v.id === filtroVendedora ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
          >
            {v.nombre}
          </button>
        ))}
      </div>

      {/* Asignaciones por vendedora */}
      {porVendedora.map(({ vendedora, items }) => (
        <div key={vendedora.id} className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: vendedora.color }} />
            <h3 className="font-semibold text-gray-800 text-sm">{vendedora.nombre}</h3>
            <span className="text-xs text-gray-400">{items.length} productos</span>
          </div>

          {items.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-4 text-center text-gray-400 text-sm">
              Sin asignaciones
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {items.map(a => {
                const vendido = a.cantidad_asignada - (a.cantidad_devuelta || 0)
                const diferencia = (a.cantidad_devuelta || 0) + vendido - a.cantidad_asignada
                return (
                  <div key={a.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{a.producto?.nombre}</p>
                        <p className="text-xs text-gray-500">{a.producto?.marca} · {a.producto?.presentacion}</p>
                      </div>
                      <button
                        onClick={() => openDevolucion(a)}
                        className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-lg"
                      >
                        <RotateCcw size={12} /> Devolver
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-blue-50 rounded-xl p-2">
                        <p className="text-xs text-blue-600 mb-0.5">Asignado</p>
                        <p className="font-bold text-blue-700">{a.cantidad_asignada}</p>
                      </div>
                      <div className="bg-green-50 rounded-xl p-2">
                        <p className="text-xs text-green-600 mb-0.5">Devuelto</p>
                        <p className="font-bold text-green-700">{a.cantidad_devuelta || 0}</p>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-2">
                        <p className="text-xs text-amber-600 mb-0.5">En mano</p>
                        <p className="font-bold text-amber-700">{a.cantidad_asignada - (a.cantidad_devuelta || 0)}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ))}

      {/* Modal asignar */}
      <Modal open={asignarOpen} onClose={() => setAsignarOpen(false)} title="Asignar stock">
        <div className="flex flex-col gap-3">
          <Select label="Vendedora" value={form.vendedora_id} onChange={e => setForm({...form, vendedora_id: e.target.value})}>
            <option value="">Seleccionar vendedora</option>
            {vendedoras.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
          </Select>
          <Select label="Producto" value={form.producto_id} onChange={e => setForm({...form, producto_id: e.target.value})}>
            <option value="">Seleccionar producto</option>
            {productos.map(p => (
              <option key={p.id} value={p.id}>
                {p.nombre} {p.presentacion} — Stock: {p.stock_actual}
              </option>
            ))}
          </Select>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Cantidad a asignar</label>
            <input
              type="number"
              min="1"
              value={form.cantidad}
              onChange={e => setForm({...form, cantidad: e.target.value})}
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-center text-xl font-bold bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="0"
            />
          </div>
          <div className="flex gap-2 mt-1">
            <Button variant="secondary" className="flex-1" onClick={() => setAsignarOpen(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleAsignar} disabled={saving}>
              {saving ? 'Guardando...' : 'Asignar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal devolución */}
      <Modal open={devolverOpen} onClose={() => setDevolverOpen(false)} title="Registrar devolución">
        <div className="flex flex-col gap-3">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-sm font-semibold text-gray-900">{selectedAsig?.producto?.nombre}</p>
            <p className="text-xs text-gray-500">Asignado: {selectedAsig?.cantidad_asignada} · En mano estimado: {selectedAsig?.cantidad_asignada - (selectedAsig?.cantidad_devuelta || 0)}</p>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Cantidad devuelta (acumulada)</label>
            <input
              type="number"
              min="0"
              value={devolucion}
              onChange={e => setDevolucion(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-center text-xl font-bold bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="0"
            />
          </div>
          <div className="flex gap-2 mt-1">
            <Button variant="secondary" className="flex-1" onClick={() => setDevolverOpen(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleDevolucion} disabled={saving}>
              {saving ? 'Guardando...' : 'Registrar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
