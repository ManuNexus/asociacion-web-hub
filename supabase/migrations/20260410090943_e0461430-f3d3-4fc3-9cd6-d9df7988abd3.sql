-- Remove the overly permissive SELECT policy that exposes all solicitudes_socio data
DROP POLICY IF EXISTS "Anyone can read solicitud by id" ON solicitudes_socio;

-- Remove the overly permissive UPDATE policy
DROP POLICY IF EXISTS "Public can update own solicitud iban" ON solicitudes_socio;