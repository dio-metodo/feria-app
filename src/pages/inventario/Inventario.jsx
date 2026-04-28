import { useState, useEffect } from 'react'
import { Plus, Search, AlertCircle, Edit2, Trash2, Package } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { getProductos, createProducto, updateProducto, deleteProducto, getPrecios } from '../../lib/queries'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Input, { Select } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'

const TIPOS = ['gaseosa', 'yogurt', 'agua', 'jugo', 'snack', 'otro']
const PRESENTACIONES = ['personal', '500ml', '1L', 'familiar', '2L', 'pack', 'otro']
const UNIDADES = ['unidad', 'pack', 'caja']

const emptyForm = {
  nombre: '', marca: '', tipo: '', presentacion: '',
  unidad_medida: 'unidad', cantidad_inicial: '', costo_unitario: ''
}

export default function Inventario() {
  const { productos, setProductos, precios, setPrecios, getPrecioProducto } = useAppStore()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getProductos().then(({ data }) => { if (data) setProductos(data) })
    getPrecios().then(({ data }) => { if (data) setPrecios(data) })
  }, [])

  const productosFiltrados = productos.filter(p =>
    `${p.nombre} ${p.marca} ${p.tipo} ${p.presentacion}`.toLowerCase().includes(search.toLowerCase())
  )

  const totalInventario = productos.reduce((sum, p) => sum + p.stock_actual * p.costo_unitario, 0)

  const openCreate = () => {
    setForm(emptyForm)
    setEditingId(null)
    setError('')
    setModalOpen(true)
  }

  const openEdit = (p) => {
    setForm({
      nombre: p.nombre, marca: p.marca || '', tipo: p.tipo || '',
      presentacion: p.presentacion || '', unidad_medida: p.unidad_medida || 'unidad',
      cantidad_inicial: p.cantidad_inicial, costo_unitario: p.costo_unitario
    })
    setEditingId(p.id)
    setError('')
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.nombre || !form.costo_unitario || form.cantidad_inicial === '') {
      setError('Nombre, costo y cantidad son obligatorios')
      return
    }
    setSaving(true)
    const payload = {
      ...form,
      cantidad_inicial: parseInt(form.cantidad_inicial),
      costo_unitario: parseFloat(form.costo_unitario),
    }
    if (editingId) {
      const { data, error } = await updateProducto(editingId, payload)
      if (!error && data) setProductos(productos.map(p => p.id === editingId ? { ...p, ...data } : p))
    } else {
      const { data, error } = await createProducto(payload)
      if (!error && data) setProductos([...productos, data])
    }
    setSaving(false)
    setModalOpen(false)
  }

  const handleDelete = async (p) => {
    if (!confirm(`¿Eliminar "${p.nombre}"?`)) return
    await deleteProducto(p.id)
    setProductos(productos.filter(x => x.id !== p.id))
  }

  const stockColor = (stock) => {
    if (stock === 0) return 'red'
    if (stock <= 5) return 'amber'
    return 'green'
  }

  return (
    <div className="p-4">
      {/* Resumen */}
      <div className="bg-green-600 rounded-2xl p-4 mb-4 text-white">
        <p className="text-green-100 text-xs mb-1">Valor total del inventario</p>
        <p className="text-2xl font-bold">S/ {totalInventario.toFixed(2)}</p>
        <p className="text-green-200 text-xs mt-1">{productos.length} productos · {productos.reduce((s,p)=>s+p.stock_actual,0)} unidades</p>
      </div>

      {/* Search + Add */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar producto..."
            className="w-full pl-9 pr-3 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <Button onClick={openCreate} size="md">
          <Plus size={18} /> Nuevo
        </Button>
      </div>

      {/* Lista */}
      <div className="flex flex-col gap-2">
        {productosFiltrados.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Package size={40} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Sin productos</p>
          </div>
        )}
        {productosFiltrados.map(p => {
          const precioVenta = getPrecioProducto(p.id)
          const ganancia = precioVenta > 0 ? ((precioVenta - p.costo_unitario) / precioVenta * 100).toFixed(0) : null
          return (
            <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-gray-900 text-sm">{p.nombre}</p>
                    {p.marca && <Badge color="blue">{p.marca}</Badge>}
                    {p.tipo && <Badge>{p.tipo}</Badge>}
                  </div>
                  {p.presentacion && (
                    <p className="text-xs text-gray-500 mb-2">{p.presentacion} · {p.unidad_medida}</p>
                  )}
                  <div className="flex items-center gap-3">
                    <Badge color={stockColor(p.stock_actual)}>
                      Stock: {p.stock_actual}
                    </Badge>
                    <span className="text-xs text-gray-500">Costo: S/ {p.costo_unitario.toFixed(2)}</span>
                    {precioVenta > 0 && <span className="text-xs text-green-600 font-medium">Venta: S/ {precioVenta.toFixed(2)}</span>}
                    {ganancia && <span className="text-xs text-amber-600">+{ganancia}%</span>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(p)} className="p-2 rounded-xl hover:bg-gray-100">
                    <Edit2 size={16} className="text-gray-500" />
                  </button>
                  <button onClick={() => handleDelete(p)} className="p-2 rounded-xl hover:bg-red-50">
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>
              </div>
              {p.stock_actual === 0 && (
                <div className="flex items-center gap-1.5 mt-2 text-red-500 text-xs">
                  <AlertCircle size={12} /> Sin stock
                </div>
              )}
              {p.stock_actual > 0 && p.stock_actual <= 5 && (
                <div className="flex items-center gap-1.5 mt-2 text-amber-500 text-xs">
                  <AlertCircle size={12} /> Stock bajo
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal crear/editar */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar producto' : 'Nuevo producto'}>
        <div className="flex flex-col gap-3">
          {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}
          <Input label="Nombre *" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Ej: Gaseosa Kola" />
          <Input label="Marca" value={form.marca} onChange={e => setForm({...form, marca: e.target.value})} placeholder="Ej: Kola Escocesa" />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Tipo" value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}>
              <option value="">Seleccionar</option>
              {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
            <Select label="Presentación" value={form.presentacion} onChange={e => setForm({...form, presentacion: e.target.value})}>
              <option value="">Seleccionar</option>
              {PRESENTACIONES.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Unidad" value={form.unidad_medida} onChange={e => setForm({...form, unidad_medida: e.target.value})}>
              {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
            </Select>
            <Input label="Cantidad inicial *" type="number" min="0" value={form.cantidad_inicial} onChange={e => setForm({...form, cantidad_inicial: e.target.value})} placeholder="0" />
          </div>
          <Input label="Costo unitario (S/) *" type="number" step="0.01" min="0" value={form.costo_unitario} onChange={e => setForm({...form, costo_unitario: e.target.value})} placeholder="0.00" />
          <div className="flex gap-2 mt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
