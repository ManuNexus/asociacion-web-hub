-- Allow anyone to view basic socio info when they are authors of news articles
CREATE POLICY "Public can view author info for news" 
ON public.socios 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.noticias 
    WHERE noticias.autor_socio_id = socios.id
  )
);