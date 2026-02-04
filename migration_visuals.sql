-- Add new columns for visual enhancements
ALTER TABLE eventos 
ADD COLUMN IF NOT EXISTS ubicacion_url TEXT,
ADD COLUMN IF NOT EXISTS imagen_url TEXT;

-- Comment on columns for clarity
COMMENT ON COLUMN eventos.ubicacion_url IS 'Enlace a Google Maps u otro servicio de mapas';
COMMENT ON COLUMN eventos.imagen_url IS 'URL de la imagen de cabecera (Hero Image) del evento';
