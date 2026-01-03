-- Add policy to allow public viewing of non-junta events
CREATE POLICY "Public can view non-junta eventos"
ON public.eventos
FOR SELECT
USING (solo_junta = false);