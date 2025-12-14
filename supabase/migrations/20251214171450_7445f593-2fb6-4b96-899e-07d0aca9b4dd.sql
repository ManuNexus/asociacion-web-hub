-- Add scheduled publication date field to noticias table
ALTER TABLE public.noticias 
ADD COLUMN IF NOT EXISTS fecha_publicacion_programada timestamp with time zone;

-- Create function to auto-publish scheduled news
CREATE OR REPLACE FUNCTION public.check_scheduled_news()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.noticias
  SET 
    publicada = true,
    fecha_publicacion = fecha_publicacion_programada
  WHERE 
    publicada = false
    AND fecha_publicacion_programada IS NOT NULL
    AND fecha_publicacion_programada <= now();
END;
$$;

-- Add comment for clarity
COMMENT ON COLUMN public.noticias.fecha_publicacion_programada IS 'Fecha y hora programada para publicar automáticamente la noticia';