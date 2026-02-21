-- Make socios-fotos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'socios-fotos';

-- Drop the existing public SELECT policy if it exists
DROP POLICY IF EXISTS "Public can view socio photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view socio photos" ON storage.objects;

-- Create restricted SELECT policy for socios and admins only
CREATE POLICY "Socios and admins can view member photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'socios-fotos' 
  AND (
    has_role(auth.uid(), 'socio'::app_role) 
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'junta'::app_role)
  )
);
