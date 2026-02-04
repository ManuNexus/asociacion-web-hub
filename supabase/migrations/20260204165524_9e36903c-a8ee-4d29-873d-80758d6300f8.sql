-- Allow anyone to read a solicitud by its ID (for completing IBAN via direct link)
CREATE POLICY "Anyone can read solicitud by id"
ON public.solicitudes_socio
FOR SELECT
TO anon, authenticated
USING (true);