-- Create storage bucket for member photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'socios-fotos',
  'socios-fotos',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own photos
CREATE POLICY "Socios can upload own photo"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'socios-fotos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own photos
CREATE POLICY "Socios can update own photo"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'socios-fotos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own photos
CREATE POLICY "Socios can delete own photo"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'socios-fotos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public access to view photos (bucket is public)
CREATE POLICY "Public can view socio photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'socios-fotos');