
CREATE TABLE public.radar_resultados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ganador_partido_id text NOT NULL,
  ganador_afinidad integer NOT NULL,
  resultados jsonb NOT NULL,
  respuestas jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.radar_resultados TO anon, authenticated;
GRANT SELECT ON public.radar_resultados TO authenticated;
GRANT ALL ON public.radar_resultados TO service_role;

ALTER TABLE public.radar_resultados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert anonymous results"
  ON public.radar_resultados FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read results"
  ON public.radar_resultados FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_radar_resultados_ganador ON public.radar_resultados(ganador_partido_id);
CREATE INDEX idx_radar_resultados_created ON public.radar_resultados(created_at DESC);
