-- Drop existing insert policy
DROP POLICY IF EXISTS "Admin can insert calendario" ON public.calendario_junta;

-- Create new policy that allows both admin and junta members to insert
CREATE POLICY "Admin and junta can insert calendario" 
ON public.calendario_junta 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'junta'::app_role)
);

-- Also allow junta members to update their own events
DROP POLICY IF EXISTS "Admin can update calendario" ON public.calendario_junta;

CREATE POLICY "Admin and junta can update calendario" 
ON public.calendario_junta 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (has_role(auth.uid(), 'junta'::app_role) AND created_by = auth.uid())
);

-- Also allow junta members to delete their own events
DROP POLICY IF EXISTS "Admin can delete calendario" ON public.calendario_junta;

CREATE POLICY "Admin and junta can delete calendario" 
ON public.calendario_junta 
FOR DELETE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (has_role(auth.uid(), 'junta'::app_role) AND created_by = auth.uid())
);