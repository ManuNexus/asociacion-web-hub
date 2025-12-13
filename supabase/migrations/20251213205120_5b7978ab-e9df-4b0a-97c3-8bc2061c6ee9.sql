-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Noticias publicadas son públicas" ON public.noticias;

-- Create a new policy that allows anyone to view any news article (for direct link access)
CREATE POLICY "Anyone can view noticias by direct link" 
ON public.noticias 
FOR SELECT 
USING (true);