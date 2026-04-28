import { useState, useEffect } from 'react'
import { Delete } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { getVendedoras } from '../lib/queries'

export default function Login() {
  const { setVendedoraActiva, setVendedoras, vendedoras } = useAppStore()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Intentar cargar vendedoras desde Supabase; si falla, quedan las del store (demo)
  useEffect(() => {
    getVendedoras().then(({ data }) => {
      if (data && data.length > 0) setVendedoras(data)
    }).catch(() => {})
  }, [])

  const handlePress = (val) => {
    if (pin.length < 4) setPin(p => p + val)
  }

  const handleDelete = () => setPin(p => p.slice(0, -1))

  useEffect(() => {
    if (pin.length === 4) handleLogin(pin)
  }, [pin])

  const handleLogin = async (pinValue) => {
    setLoading(true)
    setError('')

    // Buscar en el store local primero (funciona offline y en demo)
    const vendedora = vendedoras.find(v => v.pin === pinValue)

    if (vendedora) {
      setVendedoraActiva(vendedora)
    } else {
      setError('PIN incorrecto')
      setPin('')
    }
    setLoading(false)
  }

  const dots = [0, 1, 2, 3]
  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-green-600 px-6">
      <div className="mb-8 text-center">
        <h1 className="text-white font-bold text-3xl mb-1">FeriaApp</h1>
        <p className="text-green-200 text-sm">Ingresa tu PIN de 4 dígitos</p>
      </div>

      {/* PIN dots */}
      <div className="flex gap-4 mb-8">
        {dots.map(i => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 border-white transition-all ${
              i < pin.length ? 'bg-white' : 'bg-transparent'
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="text-red-200 text-sm mb-4 font-medium">{error}</p>
      )}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {keys.map((key, i) => {
          if (key === '') return <div key={i} />
          if (key === '⌫') return (
            <button
              key={i}
              onClick={handleDelete}
              className="h-16 flex items-center justify-center text-white text-xl rounded-2xl bg-green-700 active:bg-green-800 active:scale-95 transition-all"
            >
              <Delete size={24} />
            </button>
          )
          return (
            <button
              key={i}
              onClick={() => handlePress(key)}
              disabled={loading}
              className="h-16 flex items-center justify-center text-white text-2xl font-bold rounded-2xl bg-green-700 active:bg-green-800 active:scale-95 transition-all disabled:opacity-50"
            >
              {key}
            </button>
          )
        })}
      </div>

      {/* Mostrar PINs de las vendedoras cargadas */}
      <div className="mt-8 text-center">
        <p className="text-green-300 text-xs mb-1">Vendedoras:</p>
        {vendedoras.map(v => (
          <p key={v.id} className="text-green-200 text-xs">
            {v.nombre}: <span className="font-mono font-bold">{v.pin}</span>
          </p>
        ))}
      </div>
    </div>
  )
}
