
ALTER TABLE public.radar_resultados ADD COLUMN IF NOT EXISTS image_url text;

CREATE POLICY "Anon sube share radar"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'mailing-images' AND (storage.foldername(name))[1] = 'radar-shares');

CREATE POLICY "Anon actualiza image_url radar"
ON public.radar_resultados FOR UPDATE
TO anon, authenticated
USING (image_url IS NULL)
WITH CHECK (true);
