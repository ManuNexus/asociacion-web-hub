-- Drop the overly permissive policy that allows public to see all published news
DROP POLICY IF EXISTS "Public can view published noticias" ON public.noticias;

-- The remaining policies are correct:
-- - "Public can view published non-exclusive articles" for anon users (solo_socios = false)
-- - "Authenticated users can view articles based on role" for authenticated users
-- - "Admins can view all noticias" for admins