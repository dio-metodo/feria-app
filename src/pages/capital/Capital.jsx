import { useState, useEffect, useMemo } from 'react'
import { Wallet, Edit2, Check, X, Info } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { getVendedoras, updateCapital, getVentas, getProductos } from '../../lib/queries'
import Button from '../../components/ui/Button'

const formatSoles = (n) => `S/ ${(n || 0).toFixed(2)}`

export default function Capital() {
  const { vendedoras, setVendedoras, productos, setProductos } = useAppStore()
  const [ventas, setVentas] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)

  useEffect(() => {
    getVendedoras().then(({ data }) => { if (data) setVendedoras(data) })
    getProductos().then(({ data }) => { if (data) setProductos(data) })
    getVentas().then(({ data }) => { if (data) setVentas(data) })
  }, [])

  // Totales generales
  const totalVendido = ventas.reduce((s, v) => s + v.total, 0)
  const totalCosto = ventas.reduce((s, v) => {
    const prod = productos.find(p => p.id === v.producto_id)
    return s + (prod?.costo_unitario || 0) * v.cantidad
  }, 0)
  const gananciaEstimada = totalVendido - totalCosto
  const totalCapital = vendedoras.reduce((s, v) => s + (v.capital_aportado || 0), 0)

  // Por vendedora
  const porVendedora = useMemo(() => {
    return vendedoras.map(v => {
      const ventasV = ventas.filter(vta => vta.vendedora_id === v.id)
      const totalVendidoV = ventasV.reduce((s, vta) => s + vta.total, 0)
      const proporcion = totalCapital > 0 ? (v.capital_aportado || 0) / totalCapital : 1 / (vendedoras.length || 1)
      const gananciaCorresponde = gananciaEstimada * proporcion
      const capitalDevolver = (v.capital_aportado || 0) + gananciaCorresponde
      return {
        ...v,
        totalVendidoV,
        proporcion,
        gananciaCorresponde,
        capitalDevolver,
        diferencia: totalVendidoV - capitalDevolver,
      }
    })
  }, [vendedoras, ventas, totalCapital, gananciaEstimada])

  const startEdit = (v) => {
    setEditingId(v.id)
    setEditValue(v.capital_aportado?.toString() || '0')
  }

  const handleSave = async (id) => {
    const monto = parseFloat(editValue) || 0
    setSaving(true)
    await updateCapital(id, monto)
    setVendedoras(vendedoras.map(v => v.id === id ? { ...v, capital_aportado: monto } : v))
    setSaving(false)
    setEditingId(null)
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet size={20} className="text-green-600" />
          <h2 className="font-bold text-gray-900 text-base">Control de Capital</h2>
        </div>
        <button onClick={() => setInfoOpen(!infoOpen)} className="p-2 rounded-full hover:bg-gray-100">
          <Info size={16} className="text-gray-400" />
        </button>
      </div>

      {infoOpen && (
        <div className="bg-blue-50 rounded-2xl p-4 mb-4 text-sm text-blue-800">
          <p className="font-semibold mb-1">¿Cómo funciona?</p>
          <p>Registra cuánto aportó cada vendedora. La ganancia se divide proporcionalmente al capital aportado. Si una persona aportó el 60%, recibe el 60% de la ganancia.</p>
        </div>
      )}

      {/* Resumen general */}
      <div className="bg-green-600 rounded-2xl p-4 mb-4 text-white">
        <p className="text-green-100 text-xs mb-2">Resumen general</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-green-200 text-xs">Total vendido</p>
            <p className="font-bold text-lg">{formatSoles(totalVendido)}</p>
          </div>
          <div>
            <p className="text-green-200 text-xs">Capital invertido</p>
            <p className="font-bold text-lg">{formatSoles(totalCapital)}</p>
          </div>
          <div>
            <p className="text-green-200 text-xs">Costo estimado</p>
            <p className="font-bold">{formatSoles(totalCosto)}</p>
          </div>
          <div>
            <p className="text-green-200 text-xs">Ganancia estimada</p>
            <p className={`font-bold ${gananciaEstimada >= 0 ? 'text-white' : 'text-red-300'}`}>
              {formatSoles(gananciaEstimada)}
            </p>
          </div>
        </div>
      </div>

      {/* Por vendedora */}
      <h3 className="font-semibold text-gray-700 text-sm mb-3">Balance por vendedora</h3>
      <div className="flex flex-col gap-3">
        {porVendedora.map(v => (
          <div key={v.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header vendedora */}
            <div className="flex items-center gap-3 p-4 pb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ background: v.color }}>
                {v.nombre[0]}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{v.nombre}</p>
                <p className="text-xs text-gray-500">
                  {(v.proporcion * 100).toFixed(0)}% del capital
                </p>
              </div>
            </div>

            {/* Capital aportado editable */}
            <div className="px-4 pb-3">
              <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                <span className="text-sm text-gray-600">Capital aportado</span>
                {editingId === v.id ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 border border-green-300 rounded-xl px-2 py-1">
                      <span className="text-xs text-gray-500">S/</span>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        className="w-20 text-sm font-bold text-gray-900 focus:outline-none"
                        autoFocus
                        onKeyDown={e => { if (e.key === 'Enter') handleSave(v.id); if (e.key === 'Escape') setEditingId(null) }}
                      />
                    </div>
                    <button onClick={() => handleSave(v.id)} disabled={saving} className="p-1.5 bg-green-600 text-white rounded-full">
                      <Check size={12} />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 bg-gray-200 rounded-full">
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{formatSoles(v.capital_aportado)}</span>
                    <button onClick={() => startEdit(v)} className="p-1.5 rounded-full hover:bg-gray-200">
                      <Edit2 size={12} className="text-gray-400" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Métricas */}
            <div className="grid grid-cols-3 gap-0 border-t border-gray-100">
              <div className="p-3 text-center border-r border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Vendió</p>
                <p className="font-bold text-green-600 text-sm">{formatSoles(v.totalVendidoV)}</p>
              </div>
              <div className="p-3 text-center border-r border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Ganancia</p>
                <p className={`font-bold text-sm ${v.gananciaCorresponde >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {formatSoles(v.gananciaCorresponde)}
                </p>
              </div>
              <div className="p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">A devolver</p>
                <p className="font-bold text-blue-600 text-sm">{formatSoles(v.capitalDevolver)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center mt-6">
        Los cálculos son estimados basados en costos unitarios registrados.
      </p>
    </div>
  )
}
