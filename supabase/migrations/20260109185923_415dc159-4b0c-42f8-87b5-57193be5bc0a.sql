-- Create table for social media credentials (only for presidente/vicepresidente/admin)
CREATE TABLE public.redes_sociales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  url TEXT,
  usuario TEXT NOT NULL,
  contrasena TEXT NOT NULL,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.redes_sociales ENABLE ROW LEVEL SECURITY;

-- Only presidente, vicepresidente and admin can view
CREATE POLICY "Directivos y admin pueden ver redes sociales"
ON public.redes_sociales
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_cargo_directivo(auth.uid())
);

-- Only presidente, vicepresidente and admin can insert
CREATE POLICY "Directivos y admin pueden insertar redes sociales"
ON public.redes_sociales
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR has_cargo_directivo(auth.uid())
);

-- Only presidente, vicepresidente and admin can update
CREATE POLICY "Directivos y admin pueden actualizar redes sociales"
ON public.redes_sociales
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_cargo_directivo(auth.uid())
);

-- Only presidente, vicepresidente and admin can delete
CREATE POLICY "Directivos y admin pueden eliminar redes sociales"
ON public.redes_sociales
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_cargo_directivo(auth.uid())
);

-- Add trigger for updated_at
CREATE TRIGGER update_redes_sociales_updated_at
BEFORE UPDATE ON public.redes_sociales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();