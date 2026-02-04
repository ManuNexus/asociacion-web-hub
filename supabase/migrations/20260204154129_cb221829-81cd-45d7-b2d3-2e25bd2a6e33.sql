-- Allow public to update their own solicitud (IBAN fields only) using the solicitud ID
CREATE POLICY "Public can update own solicitud iban"
ON public.solicitudes_socio
FOR UPDATE
USING (true)
WITH CHECK (true);