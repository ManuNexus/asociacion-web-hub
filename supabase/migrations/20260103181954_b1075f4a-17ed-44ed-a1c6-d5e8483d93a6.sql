-- Add organizer field to eventos table
ALTER TABLE public.eventos ADD COLUMN organizador text DEFAULT 'AHORA';