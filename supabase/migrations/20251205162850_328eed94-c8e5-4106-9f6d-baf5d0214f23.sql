-- Drop the insecure policy
DROP POLICY IF EXISTS "Socios can view active members" ON public.socios;

-- Create secure policy: socios can only view their own data, admins and junta can view all
CREATE POLICY "Socios can view own data" 
ON public.socios 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'junta'::app_role)
);