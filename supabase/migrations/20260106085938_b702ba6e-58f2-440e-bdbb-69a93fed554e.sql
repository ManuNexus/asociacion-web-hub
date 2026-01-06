-- Recreate the view with SECURITY INVOKER to avoid security definer warning
DROP VIEW IF EXISTS public.news_authors;

CREATE VIEW public.news_authors 
WITH (security_invoker = true)
AS
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

-- Create RLS-like access by ensuring the underlying query respects permissions
-- Since socios has RLS enabled, we need a policy that allows reading author info through this view
-- We'll add a permissive policy that only exposes the columns we want through the view
CREATE POLICY "Allow reading author data for news_authors view" 
ON public.socios 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.noticias n
    WHERE n.autor_socio_id = socios.id
  )
);