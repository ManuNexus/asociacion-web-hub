-- Fix 1: Restrict news access to only published articles for public
DROP POLICY IF EXISTS "Anyone can view noticias by direct link" ON public.noticias;

CREATE POLICY "Public can view published noticias" 
ON public.noticias 
FOR SELECT 
USING (publicada = true);

-- Note: Admins already have a separate policy to view all noticias