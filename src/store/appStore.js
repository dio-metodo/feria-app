import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const DEMO_VENDEDORAS = [
  { id: 'demo-1', nombre: 'Yo', pin: '1111', capital_aportado: 0, color: '#16a34a' },
  { id: 'demo-2', nombre: 'Mamá', pin: '2222', capital_aportado: 0, color: '#2563eb' },
  { id: 'demo-3', nombre: 'Tía', pin: '3333', capital_aportado: 0, color: '#9333ea' },
]

export const DEFAULT_TIPOS = ['gaseosa', 'yogurt', 'agua', 'jugo', 'snack', 'otro']
export const DEFAULT_PRESENTACIONES = ['personal', '500ml', '1L', 'familiar', '2L', 'pack', 'otro']

export const useAppStore = create(
  persist(
    (set, get) => ({
      vendedoraActiva: null,
      setVendedoraActiva: (v) => set({ vendedoraActiva: v }),
      logout: () => set({ vendedoraActiva: null }),

      productos: [],
      precios: [],
      vendedoras: DEMO_VENDEDORAS,

      // Opciones personalizables
      customTipos: DEFAULT_TIPOS,
      customPresentaciones: DEFAULT_PRESENTACIONES,
      addTipo: (t) => set(s => ({ customTipos: [...new Set([...s.customTipos, t.trim().toLowerCase()])] })),
      removeTipo: (t) => set(s => ({ customTipos: s.customTipos.filter(x => x !== t) })),
      addPresentacion: (p) => set(s => ({ customPresentaciones: [...new Set([...s.customPresentaciones, p.trim()])] })),
      removePresentacion: (p) => set(s => ({ customPresentaciones: s.customPresentaciones.filter(x => x !== p) })),

      setProductos: (productos) => set({ productos }),
      setPrecios: (precios) => set({ precios }),

      // Al cargar vendedoras de Supabase, sincroniza la vendedora activa también
      setVendedoras: (vendedoras) => {
        const { vendedoraActiva } = get()
        let nuevaActiva = vendedoraActiva
        if (vendedoraActiva) {
          // Si la activa era demo, buscar por PIN en las nuevas
          const esDemo = vendedoraActiva.id?.startsWith('demo-')
          if (esDemo) {
            const match = vendedoras.find(v => v.pin === vendedoraActiva.pin)
            if (match) nuevaActiva = match
          } else {
            // Refrescar datos de la vendedora activa
            const match = vendedoras.find(v => v.id === vendedoraActiva.id)
            if (match) nuevaActiva = match
          }
        }
        set({ vendedoras, vendedoraActiva: nuevaActiva })
      },

      getPrecioProducto: (productoId) => {
        const { precios } = get()
        const lista = precios
          .filter((p) => p.producto_id === productoId)
          .sort((a, b) => new Date(b.vigente_desde) - new Date(a.vigente_desde))
        return lista[0]?.precio_venta ?? 0
      },
    }),
    {
      name: 'feria-app-v3',
      partialize: (state) => ({
        vendedoraActiva: state.vendedoraActiva,
        productos: state.productos,
        vendedoras: state.vendedoras,
        precios: state.precios,
        customTipos: state.customTipos,
        customPresentaciones: state.customPresentaciones,
      }),
      merge: (persisted, current) => ({
        ...current,
        ...persisted,
        vendedoras: persisted?.vendedoras?.length > 0 ? persisted.vendedoras : DEMO_VENDEDORAS,
        customTipos: persisted?.customTipos?.length > 0 ? persisted.customTipos : DEFAULT_TIPOS,
        customPresentaciones: persisted?.customPresentaciones?.length > 0 ? persisted.customPresentaciones : DEFAULT_PRESENTACIONES,
      }),
    }
  )
)
