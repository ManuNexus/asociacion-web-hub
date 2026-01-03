-- Add field to distinguish public events from member-only events
ALTER TABLE public.eventos ADD COLUMN publico boolean NOT NULL DEFAULT false;

-- Update RLS policy for public access - only truly public events
DROP POLICY IF EXISTS "Public can view non-junta eventos" ON public.eventos;

CREATE POLICY "Public can view public eventos"
ON public.eventos
FOR SELECT
USING (publico = true);