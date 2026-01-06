-- Add address fields to socios table for SEPA mandate
ALTER TABLE public.socios
ADD COLUMN IF NOT EXISTS direccion text,
ADD COLUMN IF NOT EXISTS codigo_postal text,
ADD COLUMN IF NOT EXISTS ciudad text,
ADD COLUMN IF NOT EXISTS provincia text;