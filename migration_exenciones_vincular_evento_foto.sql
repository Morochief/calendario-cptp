-- ==============================================================================
-- Migración: Vincular Evento y Foto de Hoja Firmada a Exenciones
-- Seguro para ejecutar con registros existentes (no borra ni altera datos previos)
-- ==============================================================================

-- 1. Agregar columnas evento_id y foto_url a la tabla exenciones si no existen
ALTER TABLE public.exenciones 
ADD COLUMN IF NOT EXISTS evento_id uuid REFERENCES public.eventos(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS foto_url text;

-- 2. Crear Storage Bucket para hojas firmadas de exenciones
INSERT INTO storage.buckets (id, name, public)
VALUES ('exenciones', 'exenciones', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Políticas de acceso para el bucket 'exenciones'
DROP POLICY IF EXISTS "Public Read Access to exenciones" ON storage.objects;
CREATE POLICY "Public Read Access to exenciones"
ON storage.objects FOR SELECT
USING ( bucket_id = 'exenciones' );

DROP POLICY IF EXISTS "Authenticated users can upload exenciones" ON storage.objects;
CREATE POLICY "Authenticated users can upload exenciones"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'exenciones' );

DROP POLICY IF EXISTS "Authenticated users can update exenciones" ON storage.objects;
CREATE POLICY "Authenticated users can update exenciones"
ON storage.objects FOR UPDATE
TO authenticated
USING ( auth.role() = 'authenticated' )
WITH CHECK ( bucket_id = 'exenciones' );

DROP POLICY IF EXISTS "Authenticated users can delete exenciones" ON storage.objects;
CREATE POLICY "Authenticated users can delete exenciones"
ON storage.objects FOR DELETE
TO authenticated
USING ( auth.role() = 'authenticated' );
