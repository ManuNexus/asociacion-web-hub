-- Create a function to get vote counts for votaciones (bypasses RLS but only returns counts, not individual votes)
CREATE OR REPLACE FUNCTION public.get_vote_counts_for_votaciones(votacion_ids uuid[])
RETURNS TABLE(opcion_id uuid, vote_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    v.opcion_id,
    COUNT(*)::bigint as vote_count
  FROM public.votos v
  WHERE v.votacion_id = ANY(votacion_ids)
  GROUP BY v.opcion_id
$$;