import { supabase } from './supabase'

// ── Productos ──────────────────────────────────────────────
export const getProductos = () =>
  supabase.from('productos').select('*').eq('activo', true).order('nombre')

export const createProducto = (data) => {
  const { cantidad_inicial, ...rest } = data
  return supabase
    .from('productos')
    .insert({ ...rest, cantidad_inicial, stock_actual: cantidad_inicial })
    .select()
    .single()
}

export const updateProducto = (id, data) =>
  supabase.from('productos').update(data).eq('id', id).select().single()

export const deleteProducto = (id) =>
  supabase.from('productos').update({ activo: false }).eq('id', id)

// ── Vendedoras ─────────────────────────────────────────────
export const getVendedoras = () =>
  supabase.from('vendedoras').select('*').order('nombre')

export const createVendedora = (data) =>
  supabase.from('vendedoras').insert(data).select().single()

export const updateVendedora = (id, data) =>
  supabase.from('vendedoras').update(data).eq('id', id).select().single()

export const deleteVendedora = (id) =>
  supabase.from('vendedoras').delete().eq('id', id)

export const updateCapital = (id, capital_aportado) =>
  supabase.from('vendedoras').update({ capital_aportado }).eq('id', id)

// ── Precios ────────────────────────────────────────────────
export const getPrecios = () =>
  supabase.from('precios').select('*').order('vigente_desde', { ascending: false })

export const setprecio = (producto_id, precio_venta) =>
  supabase.from('precios').insert({ producto_id, precio_venta }).select().single()

// ── Ventas ─────────────────────────────────────────────────
export const getVentas = (desde, hasta) => {
  let q = supabase
    .from('ventas')
    .select('*, producto:productos(nombre,marca,presentacion), vendedora:vendedoras(nombre,color)')
    .order('created_at', { ascending: false })
  if (desde) q = q.gte('created_at', desde)
  if (hasta) q = q.lte('created_at', hasta)
  return q
}

export const createVenta = (data) =>
  supabase.from('ventas').insert(data).select().single()

// ── Movimientos de stock ───────────────────────────────────
export const getMovimientos = (productoId) => {
  let q = supabase
    .from('movimientos_stock')
    .select('*, vendedora:vendedoras(nombre,color)')
    .order('created_at', { ascending: false })
  if (productoId) q = q.eq('producto_id', productoId)
  return q
}

export const ajustarStock = async (producto_id, tipo, cantidad, motivo, vendedora_id, stockActual) => {
  const delta = tipo === 'entrada' ? Math.abs(cantidad) : -Math.abs(cantidad)
  const stockDespues = stockActual + delta

  const { error } = await supabase
    .from('productos')
    .update({ stock_actual: stockDespues })
    .eq('id', producto_id)

  if (error) return { error }

  return supabase.from('movimientos_stock').insert({
    producto_id,
    vendedora_id,
    tipo,
    cantidad: delta,
    motivo,
    stock_antes: stockActual,
    stock_despues: stockDespues,
  }).select().single()
}

// ── Asignaciones ───────────────────────────────────────────
export const getAsignaciones = () =>
  supabase
    .from('asignaciones')
    .select('*, producto:productos(nombre,marca,presentacion,stock_actual), vendedora:vendedoras(nombre,color)')

export const upsertAsignacion = (producto_id, vendedora_id, cantidad_asignada) =>
  supabase.from('asignaciones').upsert({ producto_id, vendedora_id, cantidad_asignada }, {
    onConflict: 'producto_id,vendedora_id'
  }).select().single()

export const registrarDevolucion = (id, cantidad_devuelta) =>
  supabase.from('asignaciones').update({ cantidad_devuelta }).eq('id', id)
