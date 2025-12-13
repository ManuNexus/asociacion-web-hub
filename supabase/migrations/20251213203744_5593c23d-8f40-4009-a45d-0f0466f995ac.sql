-- Add autor_socio_id to link news to a socio (for opinion articles)
ALTER TABLE public.noticias 
ADD COLUMN autor_socio_id uuid REFERENCES public.socios(id) ON DELETE SET NULL;