
-- Fix 1: anon users could read members-only news content
DROP POLICY IF EXISTS "Public can view published articles metadata" ON public.noticias;
CREATE POLICY "Public can view published articles metadata"
ON public.noticias
FOR SELECT
TO anon
USING (publicada = true AND solo_socios = false);

-- Fix 2: restrict fotos-junta uploads to admins and junta only
DROP POLICY IF EXISTS "Authenticated upload fotos-junta" ON storage.objects;
CREATE POLICY "Admin and junta upload fotos-junta"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'fotos-junta'
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'junta'::app_role))
);

-- Fix 3: revoke EXECUTE on internal SECURITY DEFINER functions not meant to be called by clients
REVOKE EXECUTE ON FUNCTION public.check_scheduled_news() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.check_cargo_junta_unique() FROM anon, authenticated, public;
