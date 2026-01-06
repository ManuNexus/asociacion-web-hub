-- Drop the overly permissive policy that exposes all socios data
DROP POLICY IF EXISTS "Public can view author info for news" ON public.socios;

-- Create a secure public view with only safe author fields
CREATE OR REPLACE VIEW public.news_authors AS
SELECT 
  s.id,
  s.nombre,
  s.apellidos,
  s.foto_url
FROM public.socios s
WHERE EXISTS (
  SELECT 1 FROM public.noticias n
  WHERE n.autor_socio_id = s.id
);

-- Grant public read access to the view
GRANT SELECT ON public.news_authors TO anon, authenticated;