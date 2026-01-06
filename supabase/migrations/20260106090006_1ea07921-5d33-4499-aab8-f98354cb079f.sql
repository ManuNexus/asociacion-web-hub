-- Remove the problematic policy that still exposes all columns
DROP POLICY IF EXISTS "Allow reading author data for news_authors view" ON public.socios;

-- Drop the view since we'll use a function instead
DROP VIEW IF EXISTS public.news_authors;

-- Create a security definer function that only returns safe fields
CREATE OR REPLACE FUNCTION public.get_news_author(author_socio_id uuid)
RETURNS TABLE(id uuid, nombre text, apellidos text, foto_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    s.id,
    s.nombre,
    s.apellidos,
    s.foto_url
  FROM public.socios s
  WHERE s.id = author_socio_id
  AND EXISTS (
    SELECT 1 FROM public.noticias n
    WHERE n.autor_socio_id = s.id
  )
$$;