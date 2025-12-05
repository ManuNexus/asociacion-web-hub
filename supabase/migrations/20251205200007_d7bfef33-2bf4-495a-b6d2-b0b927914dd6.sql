-- Drop the previous policy if exists
DROP POLICY IF EXISTS "Socios can view junta roles" ON public.user_roles;

-- Create policy so only junta members can view junta roles
CREATE POLICY "Junta can view junta roles"
ON public.user_roles
FOR SELECT
USING (
  role = 'junta' AND has_role(auth.uid(), 'junta'::app_role)
);