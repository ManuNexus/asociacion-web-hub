-- Permitir que los amigos (sin cuenta) accedan a noticias antes exclusivas para socios
-- Las noticias "solo_socios" pasan a ser de acceso público una vez publicadas;
-- el flag sigue marcando qué noticias disparan la notificación anticipada por email.

DROP POLICY IF EXISTS "Public can view published articles metadata" ON public.noticias;
DROP POLICY IF EXISTS "Authenticated users can view articles based on role" ON public.noticias;

CREATE POLICY "Public can view published articles"
ON public.noticias
FOR SELECT
TO anon
USING (publicada = true);

CREATE POLICY "Authenticated can view published articles"
ON public.noticias
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR publicada = true);