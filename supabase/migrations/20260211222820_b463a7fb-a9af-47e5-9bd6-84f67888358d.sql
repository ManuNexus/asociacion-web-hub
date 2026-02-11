CREATE POLICY "Public can view featured ahora_tv"
ON public.ahora_tv
FOR SELECT
USING (activo = true AND destacado = true);