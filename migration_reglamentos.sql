-- Create table for regulations
create table public.reglamentos (
  id uuid not null default gen_random_uuid(),
  titulo text not null,
  url text not null,
  created_at timestamptz null default now(),
  constraint reglamentos_pkey primary key (id)
);

-- Note: You also need to create a Storage Bucket named 'reglamentos' in Supabase
-- and set up public access policies for reading, and authenticated access for uploading/deleting.

-- Enable RLS
alter table public.reglamentos enable row level security;

-- Policies
create policy "Reglamentos públicos" on public.reglamentos for select using (true);

create policy "Admin inserta reglamentos" on public.reglamentos for insert with check (auth.role() = 'authenticated');
create policy "Admin elimina reglamentos" on public.reglamentos for delete using (auth.role() = 'authenticated');
create policy "Admin actualiza reglamentos" on public.reglamentos for update using (auth.role() = 'authenticated');
