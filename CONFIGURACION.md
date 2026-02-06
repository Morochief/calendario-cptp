# Configuración de Supabase

Sigue estos pasos para configurar Supabase y conectar la aplicación.

## 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta (es gratis)
2. Click en "New Project"
3. Nombre: `calendario-fpt`
4. Genera una contraseña segura para la base de datos
5. Región: Selecciona la más cercana (ej: South America)

## 2. Obtener credenciales

Una vez creado el proyecto:

1. Ve a **Settings > API**
2. Copia:
   - **Project URL** → será tu `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → será tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 3. Configurar variables de entorno

Crea el archivo `.env.local` en la raíz del proyecto:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

## 4. Crear las tablas

Ve a **SQL Editor** en Supabase y ejecuta este script:

```sql
-- Crear tabla de modalidades
create table modalidades (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  color text default '#DC2626'
);

-- Crear tabla de eventos
create table eventos (
  id uuid default gen_random_uuid() primary key,
  modalidad_id uuid references modalidades(id) on delete cascade,
  titulo text not null,
  fecha date not null,
  hora time default '08:30',
  ubicacion text,
  descripcion text,
  tipo text default 'puntuable',
  created_at timestamp with time zone default now()
);

-- Habilitar RLS (Row Level Security)
alter table modalidades enable row level security;
alter table eventos enable row level security;

-- Políticas de lectura pública
create policy "Modalidades públicas" on modalidades for select using (true);
create policy "Eventos públicos" on eventos for select using (true);

-- Políticas de escritura solo para autenticados
create policy "Admin inserta modalidades" on modalidades for insert with check (auth.role() = 'authenticated');
create policy "Admin actualiza modalidades" on modalidades for update using (auth.role() = 'authenticated');
create policy "Admin elimina modalidades" on modalidades for delete using (auth.role() = 'authenticated');

create policy "Admin inserta eventos" on eventos for insert with check (auth.role() = 'authenticated');
create policy "Admin actualiza eventos" on eventos for update using (auth.role() = 'authenticated');
create policy "Admin elimina eventos" on eventos for delete using (auth.role() = 'authenticated');

-- Insertar las 11 modalidades
insert into modalidades (nombre, color) values
  ('Tiro Práctico IPSC', '#DC2626'),
  ('Silueta Metálica', '#2563EB'),
  ('Cartel', '#059669'),
  ('Long Range .22', '#7C3AED'),
  ('Long Range Gran Calibre', '#DB2777'),
  ('Tiro Práctico IDPA', '#EA580C'),
  ('Tiro Dinámico', '#0891B2'),
  ('Aire Comprimido (Olímpico)', '#4F46E5'),
  ('Trap Americano', '#65A30D'),
  ('Fosa Olímpica', '#CA8A04'),
  ('Fosa Olímpica', '#CA8A04'),
  ('Hélice', '#6B7280');

-- Crear tabla de reglamentos
create table reglamentos (
  id uuid default gen_random_uuid() primary key,
  titulo text not null,
  url text not null,
  created_at timestamp with time zone default now()
);

-- RLS para reglamentos
alter table reglamentos enable row level security;
create policy "Reglamentos públicos" on reglamentos for select using (true);
create policy "Admin mod reglamentos" on reglamentos for all using (auth.role() = 'authenticated');
```

## 4.1 Configurar Storage (PDFs)

1. Ve a **Storage** en Supabase.
2. Crea un nuevo bucket llamado `reglamentos`.
3. Activa "Public Bucket".
4. Añade políticas:
    - SELECT: `(bucket_id = 'reglamentos')` (para Public/Anon)
    - INSERT/DELETE: `(bucket_id = 'reglamentos')` (para Authenticated)

## 5. Crear usuario administrador

1. En Supabase, ve a **Authentication > Users**
2. Click en **Add user > Create new user**
3. Email: tu email de administrador
4. Password: una contraseña segura
5. Marca "Auto Confirm User" 

## 6. Probar localmente

```bash
npm run dev
```

Abre http://localhost:3000 para ver el calendario.
Abre http://localhost:3000/admin/login para ingresar como admin.

## 7. Deploy a Vercel

1. Sube tu código a GitHub
2. Ve a [vercel.com](https://vercel.com) e importa el repositorio
3. En Variables de Entorno, agrega:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

---

## Comandos útiles

```bash
# Desarrollo local
npm run dev

# Build de producción
npm run build

# Iniciar producción
npm start
```
