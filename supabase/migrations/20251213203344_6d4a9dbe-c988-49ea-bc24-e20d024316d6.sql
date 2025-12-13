-- Add autor field to noticias table
ALTER TABLE public.noticias 
ADD COLUMN autor text DEFAULT 'AHORA';

-- Add foto_url field to socios table
ALTER TABLE public.socios 
ADD COLUMN foto_url text;