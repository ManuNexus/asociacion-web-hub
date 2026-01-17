-- Add solo_socios field to noticias table
ALTER TABLE public.noticias 
ADD COLUMN solo_socios boolean NOT NULL DEFAULT false;

-- Add comment explaining the field
COMMENT ON COLUMN public.noticias.solo_socios IS 'When true, the article is only visible to authenticated socios until explicitly made public';

-- Update RLS policy for noticias to handle solo_socios
DROP POLICY IF EXISTS "Noticias are viewable by everyone if published" ON public.noticias;

-- New policy: public can see published articles that are NOT solo_socios
CREATE POLICY "Public can view published non-exclusive articles"
ON public.noticias
FOR SELECT
TO anon
USING (publicada = true AND solo_socios = false);

-- Authenticated users: if socio, can see all published articles; if admin, can see everything
CREATE POLICY "Authenticated users can view articles based on role"
ON public.noticias
FOR SELECT
TO authenticated
USING (
  -- Admins can see everything
  public.has_role(auth.uid(), 'admin')
  OR 
  -- Socios can see published articles (including solo_socios)
  (publicada = true AND public.has_role(auth.uid(), 'socio'))
  OR
  -- Regular authenticated users can see published non-exclusive articles
  (publicada = true AND solo_socios = false)
);