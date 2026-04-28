import { useState, useEffect } from 'react'
import { Clock, PlusCircle, MinusCircle, ChevronRight, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { getProductos, getMovimientos, ajustarStock } from '../../lib/queries'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { Select } from '../../components/ui/Input'

const TIPOS_AJUSTE = [
  { value: 'entrada', label: 'Entrada (reponer stock)', color: 'green' },
  { value: 'regalo', label: 'Regalo', color: 'purple' },
  { value: 'consumo', label: 'Consumo interno', color: 'amber' },
  { value: 'perdida', label: 'Pérdida / merma', color: 'red' },
  { value: 'ajuste', label: 'Ajuste manual', color: 'blue' },
]

const TIPO_COLOR = {
  entrada: 'green', venta: 'blue', regalo: 'purple',
  consumo: 'amber', perdida: 'red', ajuste: 'gray', devolucion: 'green'
}

const formatFecha = (ts) => new Date(ts).toLocaleString('es-PE', {
  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
})

export default function Stock() {
  const { productos, setProductos, vendedoraActiva } = useAppStore()
  const [movimientos, setMovimientos] = useState([])
  const [selectedProducto, setSelectedProducto] = useState(null)
  const [kardexOpen, setKardexOpen] = useState(false)
  const [ajusteOpen, setAjusteOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ tipo: 'entrada', cantidad: '', motivo: '' })
  const [kardexProducto, setKardexProducto] = useState(null)

  useEffect(() => {
    getProductos().then(({ data }) => { if (data) setProductos(data) })
    getMovimientos().then(({ data }) => { if (data) setMovimientos(data) })
  }, [])

  const openAjuste = (p) => {
    setSelectedProducto(p)
    setForm({ tipo: 'entrada', cantidad: '', motivo: '' })
    setAjusteOpen(true)
  }

  const openKardex = async (p) => {
    setKardexProducto(p)
    const { data } = await getMovimientos(p.id)
    if (data) setMovimientos(data)
    setKardexOpen(true)
  }

  const handleAjuste = async () => {
    if (!form.cantidad || parseInt(form.cantidad) <= 0) return
    setLoading(true)
    const { data, error } = await ajustarStock(
      selectedProducto.id,
      form.tipo,
      parseInt(form.cantidad),
      form.motivo,
      vendedoraActiva?.id,
      selectedProducto.stock_actual
    )
    if (!error) {
      const delta = form.tipo === 'entrada' ? parseInt(form.cantidad) : -parseInt(form.cantidad)
      setProductos(productos.map(p =>
        p.id === selectedProducto.id
          ? { ...p, stock_actual: p.stock_actual + delta }
          : p
      ))
      const { data: mov } = await getMovimientos()
      if (mov) setMovimientos(mov)
    }
    setLoading(false)
    setAjusteOpen(false)
  }

  const movimientosRecientes = movimientos.slice(0, 30)

  return (
    <div className="p-4">
      <h2 className="font-bold text-gray-900 text-base mb-4">Control de Stock</h2>

      {/* Lista de productos para ajuste */}
      <div className="flex flex-col gap-2 mb-6">
        {productos.map(p => (
          <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">{p.nombre}</p>
              <p className="text-xs text-gray-500">{p.marca} · {p.presentacion}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge color={p.stock_actual === 0 ? 'red' : p.stock_actual <= 5 ? 'amber' : 'green'}>
                  {p.stock_actual} en stock
                </Badge>
                <span className="text-xs text-gray-400">Inicial: {p.cantidad_inicial}</span>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => openKardex(p)}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"
                title="Ver kardex"
              >
                <Clock size={18} />
              </button>
              <button
                onClick={() => openAjuste(p)}
                className="p-2 rounded-xl hover:bg-green-50 text-green-600"
                title="Ajustar stock"
              >
                <PlusCircle size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Movimientos recientes globales */}
      <h3 className="font-semibold text-gray-700 text-sm mb-3">Movimientos recientes</h3>
      <div className="flex flex-col gap-2">
        {movimientosRecientes.map(m => (
          <div key={m.id} className="bg-white rounded-xl p-3 flex items-start gap-3 shadow-sm border border-gray-100">
            {m.cantidad > 0
              ? <ArrowUpCircle size={18} className="text-green-500 shrink-0 mt-0.5" />
              : <ArrowDownCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            }
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge color={TIPO_COLOR[m.tipo] || 'gray'}>{m.tipo}</Badge>
                <span className="text-xs text-gray-500">{m.vendedora?.nombre}</span>
              </div>
              {m.motivo && <p className="text-xs text-gray-500 mt-0.5">{m.motivo}</p>}
              <p className="text-xs text-gray-400 mt-0.5">
                Stock: {m.stock_antes} → {m.stock_despues}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className={`font-bold text-sm ${m.cantidad > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {m.cantidad > 0 ? '+' : ''}{m.cantidad}
              </p>
              <p className="text-xs text-gray-400">{formatFecha(m.created_at)}</p>
            </div>
          </div>
        ))}
        {movimientosRecientes.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-6">Sin movimientos</p>
        )}
      </div>

      {/* Modal ajuste */}
      <Modal open={ajusteOpen} onClose={() => setAjusteOpen(false)} title={`Ajustar: ${selectedProducto?.nombre}`}>
        <div className="flex flex-col gap-3">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Stock actual</p>
            <p className="text-3xl font-bold text-gray-900">{selectedProducto?.stock_actual}</p>
          </div>
          <Select
            label="Tipo de movimiento"
            value={form.tipo}
            onChange={e => setForm({...form, tipo: e.target.value})}
          >
            {TIPOS_AJUSTE.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Cantidad</label>
            <input
              type="number"
              min="1"
              value={form.cantidad}
              onChange={e => setForm({...form, cantidad: e.target.value})}
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 text-center text-xl font-bold"
              placeholder="0"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Motivo (opcional)</label>
            <input
              value={form.motivo}
              onChange={e => setForm({...form, motivo: e.target.value})}
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Ej: regalo a cliente frecuente"
            />
          </div>
          {form.tipo !== 'entrada' && form.cantidad && (
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <p className="text-xs text-amber-600">Stock resultante</p>
              <p className={`text-xl font-bold ${
                (selectedProducto?.stock_actual - parseInt(form.cantidad)) < 0 ? 'text-red-600' : 'text-gray-900'
              }`}>
                {selectedProducto?.stock_actual - parseInt(form.cantidad || 0)}
              </p>
            </div>
          )}
          <div className="flex gap-2 mt-1">
            <Button variant="secondary" className="flex-1" onClick={() => setAjusteOpen(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleAjuste} disabled={loading || !form.cantidad}>
              {loading ? 'Guardando...' : 'Registrar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal kardex */}
      <Modal open={kardexOpen} onClose={() => setKardexOpen(false)} title={`Kardex: ${kardexProducto?.nombre}`}>
        <div className="flex flex-col gap-2">
          {movimientos.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-4">Sin movimientos</p>
          )}
          {movimientos.map(m => (
            <div key={m.id} className="flex items-center gap-3 py-2 border-b border-gray-50">
              {m.cantidad > 0
                ? <ArrowUpCircle size={16} className="text-green-500 shrink-0" />
                : <ArrowDownCircle size={16} className="text-red-400 shrink-0" />
              }
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge color={TIPO_COLOR[m.tipo] || 'gray'}>{m.tipo}</Badge>
                  {m.motivo && <span className="text-xs text-gray-500">{m.motivo}</span>}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{formatFecha(m.created_at)}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${m.cantidad > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {m.cantidad > 0 ? '+' : ''}{m.cantidad}
                </p>
                <p className="text-xs text-gray-500">{m.stock_despues}</p>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
