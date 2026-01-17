-- Update the anon policy to allow viewing all published articles (metadata)
-- The frontend will handle hiding the content for non-socios
DROP POLICY IF EXISTS "Public can view published non-exclusive articles" ON public.noticias;

CREATE POLICY "Public can view published articles metadata"
ON public.noticias
FOR SELECT
TO anon
USING (publicada = true);