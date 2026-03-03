-- Tabla para galería de imágenes por evento
CREATE TABLE imagenes_evento (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  evento_id uuid NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  url text NOT NULL,
  descripcion text,
  orden integer DEFAULT 0,
  created_at timestamptz DEFAULT NOW()
);

-- Índice para consulta rápida por evento
CREATE INDEX idx_imagenes_evento_evento_id ON imagenes_evento(evento_id);

-- Habilitar RLS
ALTER TABLE imagenes_evento ENABLE ROW LEVEL SECURITY;

-- Política pública de lectura
CREATE POLICY "Lectura pública imagenes_evento" ON imagenes_evento
  FOR SELECT USING (true);

-- Política de escritura solo para admins autenticados
CREATE POLICY "Solo admins gestionan imagenes_evento" ON imagenes_evento
  FOR ALL USING (auth.role() = 'authenticated');

-- Insertar las 5 fotos del Blackjack Rimfire (21 feb 2026)
-- Reemplazar EVENTO_ID con el UUID real del evento en Supabase
-- INSERT INTO imagenes_evento (evento_id, url, descripcion, orden) VALUES
--   ('EVENTO_ID', '/blackjack 1.jpg', 'Competencia Blackjack Rimfire', 1),
--   ('EVENTO_ID', '/blackjack 2.jpg', 'Competencia Blackjack Rimfire', 2),
--   ('EVENTO_ID', '/blackjack 3.jpg', 'Competencia Blackjack Rimfire', 3),
--   ('EVENTO_ID', '/blackjack 4.jpg', 'Competencia Blackjack Rimfire', 4),
--   ('EVENTO_ID', '/blackjack 5.jpg', 'Resultados', 5);
