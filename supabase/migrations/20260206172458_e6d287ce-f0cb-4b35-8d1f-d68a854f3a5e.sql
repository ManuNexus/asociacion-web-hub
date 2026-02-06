-- Create table for AHORA TV content (videos and live streams)
CREATE TABLE public.ahora_tv (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  youtube_url TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'video' CHECK (tipo IN ('video', 'directo')),
  en_directo BOOLEAN NOT NULL DEFAULT false,
  activo BOOLEAN NOT NULL DEFAULT true,
  destacado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable Row Level Security
ALTER TABLE public.ahora_tv ENABLE ROW LEVEL SECURITY;

-- Socios can view active content
CREATE POLICY "Socios can view active ahora_tv content"
ON public.ahora_tv
FOR SELECT
USING (
  activo = true AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'junta'::app_role) OR
    has_role(auth.uid(), 'socio'::app_role)
  )
);

-- Admins can view all content (including inactive)
CREATE POLICY "Admins can view all ahora_tv"
ON public.ahora_tv
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert content
CREATE POLICY "Admins can insert ahora_tv"
ON public.ahora_tv
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update content
CREATE POLICY "Admins can update ahora_tv"
ON public.ahora_tv
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete content
CREATE POLICY "Admins can delete ahora_tv"
ON public.ahora_tv
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_ahora_tv_updated_at
  BEFORE UPDATE ON public.ahora_tv
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();