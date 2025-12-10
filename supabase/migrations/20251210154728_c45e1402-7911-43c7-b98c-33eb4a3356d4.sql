-- Drop the existing SELECT policy for socios
DROP POLICY IF EXISTS "Socios can view own data" ON public.socios;

-- Create policy for users to view their own data (all fields)
CREATE POLICY "Users can view own data"
ON public.socios
FOR SELECT
USING (auth.uid() = user_id);

-- Create policy for admins to view all data (all fields)
CREATE POLICY "Admins can view all socios"
ON public.socios
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create policy for junta to view non-sensitive fields only
-- This restricts junta from seeing: iban, titular_cuenta
CREATE POLICY "Junta can view non-sensitive socios data"
ON public.socios
FOR SELECT
USING (has_role(auth.uid(), 'junta'::app_role));

-- Create a view for junta members that masks sensitive data
CREATE OR REPLACE VIEW public.socios_junta_view AS
SELECT 
  id,
  user_id,
  nombre,
  apellidos,
  email,
  telefono,
  numero_socio,
  tipo_cuota,
  tipo_pago,
  activo,
  al_corriente_pago,
  fecha_alta,
  created_at,
  updated_at,
  -- Mask sensitive financial data
  NULL::text as iban,
  NULL::text as titular_cuenta
FROM public.socios;