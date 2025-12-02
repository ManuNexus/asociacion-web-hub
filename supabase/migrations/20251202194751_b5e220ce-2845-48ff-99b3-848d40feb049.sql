-- Create categories table
CREATE TABLE public.categorias_noticia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categorias_noticia ENABLE ROW LEVEL SECURITY;

-- Public can view categories
CREATE POLICY "Categories are publicly viewable"
ON public.categorias_noticia
FOR SELECT
USING (true);

-- Admins can manage categories
CREATE POLICY "Admins can insert categories"
ON public.categorias_noticia
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update categories"
ON public.categorias_noticia
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete categories"
ON public.categorias_noticia
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add category_id to noticias table
ALTER TABLE public.noticias
ADD COLUMN categoria_id UUID REFERENCES public.categorias_noticia(id) ON DELETE SET NULL;

-- Insert default category
INSERT INTO public.categorias_noticia (nombre, color) VALUES ('Institucional', '#3B82F6');