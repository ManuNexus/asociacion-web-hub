CREATE OR REPLACE FUNCTION public.match_casos_semaforo(_texto text, _threshold real DEFAULT 0.8, _limit integer DEFAULT 5)
 RETURNS TABLE(id uuid, titulo text, descripcion text, fuente_url text, created_at timestamp with time zone, similarity real)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;