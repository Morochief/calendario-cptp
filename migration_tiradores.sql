-- ==============================================================================
-- Migración: Tabla de Padrón de Tiradores / Socios (para autoregistro y autocompletado)
-- ==============================================================================

create table if not exists public.tiradores (
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tiradores_pkey primary key (id)
);

-- Índice único opcional en CI para evitar duplicados si tiene CI
create index if not exists idx_tiradores_ci on public.tiradores (ci);
create index if not exists idx_tiradores_nombre_apellido on public.tiradores (nombre, apellido);

-- Habilitar RLS
alter table public.tiradores enable row level security;

-- Políticas de RLS
-- Permitir a usuarios anónimos (tiradores desde el link público) registrar sus datos
drop policy if exists "Público puede insertar tirador" on public.tiradores;
create policy "Público puede insertar tirador" on public.tiradores for insert with check (true);

-- Permitir a todos consultar para el autocompletado y verificación de duplicados
drop policy if exists "Lectura de tiradores" on public.tiradores;
create policy "Lectura de tiradores" on public.tiradores for select using (true);

-- Actualización y eliminación para administradores
drop policy if exists "Admin actualiza tiradores" on public.tiradores;
create policy "Admin actualiza tiradores" on public.tiradores for update using (auth.role() = 'authenticated');

drop policy if exists "Admin elimina tiradores" on public.tiradores;
create policy "Admin elimina tiradores" on public.tiradores for delete using (auth.role() = 'authenticated');
