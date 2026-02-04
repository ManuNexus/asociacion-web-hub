-- Drop and recreate the INSERT policy with correct roles
DROP POLICY IF EXISTS "Anyone can submit membership request" ON public.solicitudes_socio;

CREATE POLICY "Anyone can submit membership request"
ON public.solicitudes_socio
FOR INSERT
TO anon, authenticated
WITH CHECK (true);