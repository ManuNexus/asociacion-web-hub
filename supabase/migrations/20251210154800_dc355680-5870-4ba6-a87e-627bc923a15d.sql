-- Drop the SECURITY DEFINER view
DROP VIEW IF EXISTS public.socios_junta_view;

-- Drop the junta policy that gives them full table access
DROP POLICY IF EXISTS "Junta can view non-sensitive socios data" ON public.socios;

-- Create a secure function for junta to get masked member data
-- Using SECURITY DEFINER with explicit search_path for safety
CREATE OR REPLACE FUNCTION public.get_socios_for_junta()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  nombre text,
  apellidos text,
  email text,
  telefono text,
  numero_socio text,
  tipo_cuota text,
  tipo_pago text,
  activo boolean,
  al_corriente_pago boolean,
  fecha_alta timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    s.id,
    s.user_id,
    s.nombre,
    s.apellidos,
    s.email,
    s.telefono,
    s.numero_socio,
    s.tipo_cuota,
    s.tipo_pago,
    s.activo,
    s.al_corriente_pago,
    s.fecha_alta,
    s.created_at,
    s.updated_at
  FROM public.socios s
  WHERE has_role(auth.uid(), 'junta'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
$$;