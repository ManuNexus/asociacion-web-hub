-- Update get_socios_for_junta function to include dia_cobro
DROP FUNCTION IF EXISTS public.get_socios_for_junta();

CREATE OR REPLACE FUNCTION public.get_socios_for_junta()
 RETURNS TABLE(id uuid, user_id uuid, nombre text, apellidos text, email text, telefono text, numero_socio text, tipo_cuota text, tipo_pago text, activo boolean, al_corriente_pago boolean, fecha_alta timestamp with time zone, created_at timestamp with time zone, updated_at timestamp with time zone, dia_cobro integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    s.updated_at,
    s.dia_cobro
  FROM public.socios s
  WHERE has_role(auth.uid(), 'junta'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
$function$;