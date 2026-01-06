-- Add roles column to calendario_junta (array of cargo_junta)
ALTER TABLE public.calendario_junta 
ADD COLUMN roles cargo_junta[] DEFAULT ARRAY[]::cargo_junta[];

-- Update RLS policies to allow admin full access
DROP POLICY IF EXISTS "Directivos can insert calendario" ON public.calendario_junta;
DROP POLICY IF EXISTS "Directivos can update calendario" ON public.calendario_junta;
DROP POLICY IF EXISTS "Directivos can delete calendario" ON public.calendario_junta;

CREATE POLICY "Admin can insert calendario"
ON public.calendario_junta
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can update calendario"
ON public.calendario_junta
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can delete calendario"
ON public.calendario_junta
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));