-- Función para obtener miembros de junta con cargo, accesible para directivos
CREATE OR REPLACE FUNCTION public.get_miembros_junta()
RETURNS TABLE(id uuid, nombre text, apellidos text, cargo_junta cargo_junta)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    s.id,
    s.nombre,
    s.apellidos,
    s.cargo_junta
  FROM public.socios s
  WHERE s.activo = true
    AND s.cargo_junta IS NOT NULL
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_cargo_directivo(auth.uid()))
  ORDER BY 
    CASE s.cargo_junta
      WHEN 'presidente' THEN 1
      WHEN 'vicepresidente' THEN 2
      WHEN 'secretario' THEN 3
      WHEN 'tesorero' THEN 4
      WHEN 'vocal' THEN 5
    END
$$;