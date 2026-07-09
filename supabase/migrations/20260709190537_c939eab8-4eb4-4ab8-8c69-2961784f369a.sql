
CREATE TABLE public.radar_partidos (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#224172',
  logo_url TEXT,
  axis_x NUMERIC NOT NULL DEFAULT 0,
  axis_y NUMERIC NOT NULL DEFAULT 0,
  orden INTEGER NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.radar_partidos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.radar_partidos TO authenticated;
GRANT ALL ON public.radar_partidos TO service_role;

ALTER TABLE public.radar_partidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos pueden ver partidos activos"
  ON public.radar_partidos FOR SELECT
  USING (activo = true OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Solo admin puede insertar partidos"
  ON public.radar_partidos FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Solo admin puede actualizar partidos"
  ON public.radar_partidos FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Solo admin puede eliminar partidos"
  ON public.radar_partidos FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_radar_partidos_updated
  BEFORE UPDATE ON public.radar_partidos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed inicial (Ciudadanos se añadirá manualmente cuando llegue su programa)
INSERT INTO public.radar_partidos (id, nombre, color, axis_x, axis_y, orden) VALUES
  ('PP',       'PP',       '#1D9BD1',  1.3,  1.2, 1),
  ('PSOE',     'PSOE',     '#E30613', -0.8, -0.5, 2),
  ('VOX',      'VOX',      '#63BE21',  1.6,  1.8, 3),
  ('SUMAR',    'SUMAR',    '#D9377E', -1.5, -1.4, 4),
  ('PODEMOS',  'PODEMOS',  '#6E236E', -1.7, -1.6, 5);

-- Políticas de storage para logos de radar (usando bucket público existente 'mailing-images')
CREATE POLICY "Admin sube logos radar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'mailing-images'
    AND (storage.foldername(name))[1] = 'radar-logos'
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admin actualiza logos radar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'mailing-images'
    AND (storage.foldername(name))[1] = 'radar-logos'
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admin borra logos radar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'mailing-images'
    AND (storage.foldername(name))[1] = 'radar-logos'
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );
