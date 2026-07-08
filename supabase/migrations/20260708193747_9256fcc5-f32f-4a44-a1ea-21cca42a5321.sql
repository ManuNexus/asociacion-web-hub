CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS casos_semaforo_titulo_trgm_idx
  ON public.casos_semaforo USING gin (titulo gin_trgm_ops);

CREATE INDEX IF NOT EXISTS casos_semaforo_descripcion_trgm_idx
  ON public.casos_semaforo USING gin (descripcion gin_trgm_ops);

CREATE OR REPLACE FUNCTION public.match_casos_semaforo(
  _texto text,
  _threshold real DEFAULT 0.6,
  _limit int DEFAULT 5
)
RETURNS TABLE(
  id uuid,
  titulo text,
  descripcion text,
  fuente_url text,
  created_at timestamptz,
  similarity real
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.titulo,
    c.descripcion,
    c.fuente_url,
    c.created_at,
    GREATEST(
      similarity(c.titulo, _texto),
      similarity(coalesce(c.descripcion,''), _texto)
    ) AS similarity
  FROM public.casos_semaforo c
  WHERE c.titulo % _texto
     OR c.descripcion % _texto
  ORDER BY similarity DESC
  LIMIT _limit
$$;

-- Ajustar el umbral por defecto de pg_trgm para el operador %
-- (esto es a nivel de sesión; la función usa similarity() explícito, así que no depende de esto)
