-- Añadir política para que presidente y tesorero puedan ver todos los socios
CREATE POLICY "Contables pueden ver todos los socios"
ON public.socios
FOR SELECT
USING (has_cargo_contable(auth.uid()));