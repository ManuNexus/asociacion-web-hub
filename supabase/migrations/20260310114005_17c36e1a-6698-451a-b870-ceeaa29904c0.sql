
INSERT INTO storage.buckets (id, name, public)
VALUES ('mailing-images', 'mailing-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read mailing images"
ON storage.objects FOR SELECT
USING (bucket_id = 'mailing-images');

CREATE POLICY "Admin insert mailing images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'mailing-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admin delete mailing images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'mailing-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);
