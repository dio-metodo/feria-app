-- =============================================
-- FERIA APP — Schema Supabase
-- Ejecutar en el SQL Editor de Supabase
-- =============================================

-- Vendedoras (usuarios del sistema)
create table vendedoras (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  pin text not null,          -- PIN de 4 dígitos (almacenar como hash en prod)
  capital_aportado numeric(10,2) default 0,
  color text default '#16a34a',
  created_at timestamptz default now()
);

-- Productos
create table productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  marca text,
  tipo text,                  -- gaseosa, yogurt, agua, etc.
  presentacion text,          -- personal, 1L, familiar, etc.
  unidad_medida text default 'unidad',
  cantidad_inicial integer default 0,
  stock_actual integer default 0,
  costo_unitario numeric(10,2) not null,
  activo boolean default true,
  created_at timestamptz default now()
);

-- Precios de venta (historial)
create table precios (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid references productos(id) on delete cascade,
  precio_venta numeric(10,2) not null,
  vigente_desde timestamptz default now(),
  created_at timestamptz default now()
);

-- Ventas
create table ventas (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid references productos(id),
  vendedora_id uuid references vendedoras(id),
  cantidad integer not null,
  precio_unitario numeric(10,2) not null,
  descuento numeric(10,2) default 0,
  total numeric(10,2) generated always as (cantidad * precio_unitario - descuento) stored,
  nota text,
  created_at timestamptz default now()
);

-- Movimientos de stock (kardex)
create table movimientos_stock (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid references productos(id),
  vendedora_id uuid references vendedoras(id),
  tipo text not null check (tipo in ('entrada','venta','regalo','consumo','perdida','ajuste','devolucion')),
  cantidad integer not null,   -- positivo = entrada, negativo = salida
  motivo text,
  referencia_id uuid,          -- venta_id si tipo='venta'
  stock_antes integer,
  stock_despues integer,
  created_at timestamptz default now()
);

-- Asignaciones de stock por vendedora
create table asignaciones (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid references productos(id),
  vendedora_id uuid references vendedoras(id),
  cantidad_asignada integer default 0,
  cantidad_devuelta integer default 0,
  created_at timestamptz default now(),
  unique(producto_id, vendedora_id)
);

-- =============================================
-- Datos iniciales de ejemplo
-- =============================================

insert into vendedoras (nombre, pin, capital_aportado, color) values
  ('Yo', '1111', 0, '#16a34a'),
  ('Mamá', '2222', 0, '#2563eb'),
  ('Tía', '3333', 0, '#9333ea');

-- =============================================
-- Función para actualizar stock automáticamente
-- =============================================

create or replace function actualizar_stock_en_venta()
returns trigger as $$
declare
  stock_anterior integer;
begin
  select stock_actual into stock_anterior from productos where id = NEW.producto_id;

  -- Descontar del stock
  update productos
  set stock_actual = stock_actual - NEW.cantidad
  where id = NEW.producto_id;

  -- Registrar movimiento
  insert into movimientos_stock (producto_id, vendedora_id, tipo, cantidad, motivo, referencia_id, stock_antes, stock_despues)
  values (NEW.producto_id, NEW.vendedora_id, 'venta', -NEW.cantidad, 'Venta registrada', NEW.id,
          stock_anterior, stock_anterior - NEW.cantidad);

  return NEW;
end;
$$ language plpgsql;

create trigger trigger_venta_stock
after insert on ventas
for each row execute function actualizar_stock_en_venta();

-- =============================================
-- RLS (Row Level Security) — desactivado para MVP
-- =============================================
alter table vendedoras enable row level security;
alter table productos enable row level security;
alter table precios enable row level security;
alter table ventas enable row level security;
alter table movimientos_stock enable row level security;
alter table asignaciones enable row level security;

-- Política temporal: acceso total (cambiar en producción)
create policy "acceso_total" on vendedoras for all using (true) with check (true);
create policy "acceso_total" on productos for all using (true) with check (true);
create policy "acceso_total" on precios for all using (true) with check (true);
create policy "acceso_total" on ventas for all using (true) with check (true);
create policy "acceso_total" on movimientos_stock for all using (true) with check (true);
create policy "acceso_total" on asignaciones for all using (true) with check (true);
