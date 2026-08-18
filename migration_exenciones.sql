-- Crear tabla de exenciones
create table public.exenciones (
  id uuid not null default gen_random_uuid(),
  nombre text not null,
  apellido text not null,
  nro_socio text null,
  profesion text null,
  ci text null,
  fecha_nacimiento text null,
  direccion text null,
  telefono text null,
  celular text null,
  email text null,
  ciudad text null default 'Asunción',
  dia text null,
  mes text null,
  anho text null,
  admin_user text null,
  created_at timestamptz not null default now(),
  constraint exenciones_pkey primary key (id)
);

-- Habilitar RLS (Row Level Security)
alter table public.exenciones enable row level security;

-- Políticas de acceso
-- Solo usuarios autenticados (Admin) pueden ver, insertar, actualizar y eliminar exenciones
create policy "Admin lee exenciones" on public.exenciones for select using (auth.role() = 'authenticated');
create policy "Admin inserta exenciones" on public.exenciones for insert with check (auth.role() = 'authenticated');
create policy "Admin actualiza exenciones" on public.exenciones for update using (auth.role() = 'authenticated');
create policy "Admin elimina exenciones" on public.exenciones for delete using (auth.role() = 'authenticated');
