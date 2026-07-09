CREATE OR REPLACE FUNCTION public.get_radar_affinity_counts()
RETURNS TABLE (
  id text,
  nombre text,
  color text,
  count bigint,
  pct numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH totals AS (
    SELECT COUNT(*)::numeric AS total
    FROM public.radar_resultados
  ),
  winners AS (
    SELECT r.ganador_partido_id AS party_id, COUNT(*)::bigint AS cnt
    FROM public.radar_resultados r
    GROUP BY r.ganador_partido_id
  )
  SELECT
    p.id,
    p.nombre,
    p.color,
    COALESCE(w.cnt, 0) AS count,
    CASE WHEN t.total > 0 THEN ROUND((COALESCE(w.cnt, 0) / t.total) * 100, 1) ELSE 0 END AS pct
  FROM public.radar_partidos p
  CROSS JOIN totals t
  LEFT JOIN winners w ON w.party_id = p.id
  WHERE p.activo = true
  ORDER BY count DESC, p.orden ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_radar_affinity_counts() TO anon;
GRANT EXECUTE ON FUNCTION public.get_radar_affinity_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_radar_affinity_counts() TO service_role;
