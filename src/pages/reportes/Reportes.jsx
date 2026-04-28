import { useState, useEffect, useMemo } from 'react'
import { BarChart3, Download, Calendar, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { getVentas, getProductos, getVendedoras } from '../../lib/queries'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const HOY = new Date().toISOString().slice(0, 10)

const formatSoles = (n) => `S/ ${(n || 0).toFixed(2)}`
const formatFecha = (ts) => new Date(ts).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

export default function Reportes() {
  const { productos, vendedoras, setProductos, setVendedoras } = useAppStore()
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(false)
  const [filtroFecha, setFiltroFecha] = useState(HOY)
  const [tab, setTab] = useState('resumen') // resumen | ventas | vendedoras

  const cargar = async () => {
    setLoading(true)
    const desde = filtroFecha ? `${filtroFecha}T00:00:00` : undefined
    const hasta = filtroFecha ? `${filtroFecha}T23:59:59` : undefined
    const [{ data: v }, { data: p }, { data: vnd }] = await Promise.all([
      getVentas(desde, hasta),
      getProductos(),
      getVendedoras(),
    ])
    if (v) setVentas(v)
    if (p) setProductos(p)
    if (vnd) setVendedoras(vnd)
    setLoading(false)
  }

  useEffect(() => { cargar() }, [filtroFecha])

  // Cálculos generales
  const totalVendido = ventas.reduce((s, v) => s + v.total, 0)
  const totalCosto = ventas.reduce((s, v) => {
    const prod = productos.find(p => p.id === v.producto_id)
    return s + (prod?.costo_unitario || 0) * v.cantidad
  }, 0)
  const gananciaEstimada = totalVendido - totalCosto
  const totalUnidades = ventas.reduce((s, v) => s + v.cantidad, 0)

  // Top productos
  const porProducto = useMemo(() => {
    const map = {}
    ventas.forEach(v => {
      const nombre = v.producto?.nombre || v.producto_id
      if (!map[nombre]) map[nombre] = { nombre, unidades: 0, total: 0 }
      map[nombre].unidades += v.cantidad
      map[nombre].total += v.total
    })
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 8)
  }, [ventas])

  // Por vendedora
  const porVendedora = useMemo(() => {
    const map = {}
    ventas.forEach(v => {
      const id = v.vendedora_id
      if (!map[id]) map[id] = { vendedora: v.vendedora, unidades: 0, total: 0 }
      map[id].unidades += v.cantidad
      map[id].total += v.total
    })
    return Object.values(map).sort((a, b) => b.total - a.total)
  }, [ventas])

  const exportExcel = async () => {
    const { utils, writeFile } = await import('xlsx')
    const datos = ventas.map(v => ({
      Fecha: formatFecha(v.created_at),
      Producto: v.producto?.nombre,
      Marca: v.producto?.marca,
      Presentación: v.producto?.presentacion,
      Vendedora: v.vendedora?.nombre,
      Cantidad: v.cantidad,
      'Precio Unit.': v.precio_unitario,
      Descuento: v.descuento || 0,
      Total: v.total,
    }))
    const ws = utils.json_to_sheet(datos)
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'Ventas')

    // Resumen
    const resumen = [
      { Concepto: 'Total vendido', Valor: totalVendido.toFixed(2) },
      { Concepto: 'Costo estimado', Valor: totalCosto.toFixed(2) },
      { Concepto: 'Ganancia estimada', Valor: gananciaEstimada.toFixed(2) },
      { Concepto: 'Unidades vendidas', Valor: totalUnidades },
    ]
    const ws2 = utils.json_to_sheet(resumen)
    utils.book_append_sheet(wb, ws2, 'Resumen')
    writeFile(wb, `feria-ventas-${filtroFecha || 'todas'}.xlsx`)
  }

  const COLORS = ['#16a34a','#2563eb','#9333ea','#f59e0b','#ef4444','#06b6d4','#ec4899','#84cc16']

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={20} className="text-green-600" />
          <h2 className="font-bold text-gray-900 text-base">Reportes</h2>
        </div>
        <Button variant="secondary" size="sm" onClick={exportExcel}>
          <Download size={14} /> Excel
        </Button>
      </div>

      {/* Filtro fecha */}
      <div className="flex gap-2 mb-4 items-center">
        <div className="relative flex-1">
          <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="date"
            value={filtroFecha}
            onChange={e => setFiltroFecha(e.target.value)}
            className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <button onClick={() => setFiltroFecha('')} className="px-3 py-2.5 text-xs text-gray-500 bg-white border border-gray-200 rounded-xl">Todo</button>
        <button onClick={cargar} className="p-2.5 bg-white border border-gray-200 rounded-xl">
          <RefreshCw size={14} className={loading ? 'animate-spin text-green-500' : 'text-gray-400'} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
        {[['resumen', 'Resumen'], ['ventas', 'Ventas'], ['vendedoras', 'Por vendedora']].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${tab === k ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Tab: Resumen */}
      {tab === 'resumen' && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Total vendido" value={formatSoles(totalVendido)} color="green" />
            <StatCard label="Unidades" value={totalUnidades} color="blue" />
            <StatCard label="Costo estimado" value={formatSoles(totalCosto)} color="gray" />
            <StatCard label="Ganancia estimada" value={formatSoles(gananciaEstimada)} color={gananciaEstimada >= 0 ? 'green' : 'red'} />
          </div>

          {porProducto.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="font-semibold text-gray-800 text-sm mb-3">Top productos (S/ vendido)</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={porProducto} layout="vertical" margin={{ left: 0, right: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="nombre" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip formatter={(v) => `S/ ${v.toFixed(2)}`} />
                  <Bar dataKey="total" radius={4}>
                    {porProducto.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Tab: Ventas */}
      {tab === 'ventas' && (
        <div className="flex flex-col gap-2">
          {ventas.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">Sin ventas en este período</p>
          )}
          {ventas.map(v => (
            <div key={v.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{v.producto?.nombre} {v.producto?.presentacion}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {v.vendedora && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: v.vendedora.color + '20', color: v.vendedora.color }}>
                        {v.vendedora.nombre}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{formatFecha(v.created_at)}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-green-600">S/ {v.total.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">{v.cantidad} × {v.precio_unitario.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Por vendedora */}
      {tab === 'vendedoras' && (
        <div className="flex flex-col gap-3">
          {porVendedora.map(({ vendedora, unidades, total }) => (
            <div key={vendedora?.nombre} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full" style={{ background: vendedora?.color }} />
                <p className="font-semibold text-gray-900">{vendedora?.nombre}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-green-600 mb-0.5">Total vendido</p>
                  <p className="font-bold text-green-700">S/ {total.toFixed(2)}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-blue-600 mb-0.5">Unidades</p>
                  <p className="font-bold text-blue-700">{unidades}</p>
                </div>
              </div>
            </div>
          ))}
          {porVendedora.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">Sin ventas en este período</p>
          )}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }) {
  const colors = {
    green: 'bg-green-50 text-green-700 border-green-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    gray: 'bg-gray-50 text-gray-700 border-gray-100',
  }
  return (
    <div className={`rounded-2xl p-4 border ${colors[color]}`}>
      <p className="text-xs opacity-70 mb-1">{label}</p>
      <p className="font-bold text-xl">{value}</p>
    </div>
  )
}
