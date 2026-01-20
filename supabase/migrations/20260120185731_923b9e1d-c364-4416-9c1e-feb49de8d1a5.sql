-- Create policy for admins to upload mailing images
CREATE POLICY "Admins can upload mailing images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'socios-fotos' 
  AND (storage.foldername(name))[1] = 'mailings'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Create policy for admins to update mailing images
CREATE POLICY "Admins can update mailing images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'socios-fotos' 
  AND (storage.foldername(name))[1] = 'mailings'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Create policy for admins to delete mailing images
CREATE POLICY "Admins can delete mailing images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'socios-fotos' 
  AND (storage.foldername(name))[1] = 'mailings'
  AND has_role(auth.uid(), 'admin'::app_role)
);