
INSERT INTO storage.buckets (id, name, public)
VALUES ('noticias-images', 'noticias-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read noticias images"
ON storage.objects FOR SELECT
USING (bucket_id = 'noticias-images');

CREATE POLICY "Admin insert noticias images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'noticias-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admin delete noticias images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'noticias-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);
