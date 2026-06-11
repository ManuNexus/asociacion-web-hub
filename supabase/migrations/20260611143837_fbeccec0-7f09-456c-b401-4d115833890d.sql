
-- 1. Fix noticias authenticated SELECT policy: restrict solo_socios to socios/admin
DROP POLICY IF EXISTS "Authenticated can view published articles" ON public.noticias;
CREATE POLICY "Authenticated can view published articles"
ON public.noticias
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    publicada = true
    AND (
      solo_socios = false
      OR has_role(auth.uid(), 'socio'::app_role)
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  )
);

-- Also tighten anon policy in case
DROP POLICY IF EXISTS "Public can view published articles" ON public.noticias;
CREATE POLICY "Public can view published articles"
ON public.noticias
FOR SELECT
TO anon
USING (publicada = true AND solo_socios = false);

-- 2. Add DELETE/UPDATE policies for fotos-junta bucket scoped to admin and junta
CREATE POLICY "Admin and junta update fotos-junta"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'fotos-junta' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'junta'::app_role)))
WITH CHECK (bucket_id = 'fotos-junta' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'junta'::app_role)));

CREATE POLICY "Admin and junta delete fotos-junta"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'fotos-junta' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'junta'::app_role)));

-- 3. Tighten socios-fotos policies: require 'socio' role
DROP POLICY IF EXISTS "Socios can upload own photo" ON storage.objects;
CREATE POLICY "Socios can upload own photo"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'socios-fotos'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND has_role(auth.uid(), 'socio'::app_role)
);

DROP POLICY IF EXISTS "Socios can update own photo" ON storage.objects;
CREATE POLICY "Socios can update own photo"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'socios-fotos'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND has_role(auth.uid(), 'socio'::app_role)
)
WITH CHECK (
  bucket_id = 'socios-fotos'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND has_role(auth.uid(), 'socio'::app_role)
);

DROP POLICY IF EXISTS "Socios can delete own photo" ON storage.objects;
CREATE POLICY "Socios can delete own photo"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'socios-fotos'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND has_role(auth.uid(), 'socio'::app_role)
);
