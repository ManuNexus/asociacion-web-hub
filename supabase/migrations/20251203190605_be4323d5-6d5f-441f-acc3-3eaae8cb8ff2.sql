-- Allow socios to update their own record
CREATE POLICY "Socios can update own data"
ON public.socios
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);