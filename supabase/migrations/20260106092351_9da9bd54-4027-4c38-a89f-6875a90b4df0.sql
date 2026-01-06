-- Create contacts directory table
CREATE TABLE public.contactos_directorio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  organizacion TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'otro',
  email TEXT,
  telefono TEXT,
  direccion TEXT,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.contactos_directorio ENABLE ROW LEVEL SECURITY;

-- Create function to check if user has president/vicepresident cargo
CREATE OR REPLACE FUNCTION public.has_cargo_directivo(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.socios s
    WHERE s.user_id = _user_id
      AND s.activo = true
      AND s.cargo_junta IN ('presidente', 'vicepresidente')
  )
$$;

-- RLS Policies: Only admin, presidente, vicepresidente can access
CREATE POLICY "Directivos can view contacts"
ON public.contactos_directorio
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_cargo_directivo(auth.uid())
);

CREATE POLICY "Directivos can insert contacts"
ON public.contactos_directorio
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_cargo_directivo(auth.uid())
);

CREATE POLICY "Directivos can update contacts"
ON public.contactos_directorio
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_cargo_directivo(auth.uid())
);

CREATE POLICY "Directivos can delete contacts"
ON public.contactos_directorio
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_cargo_directivo(auth.uid())
);

-- Trigger for updated_at
CREATE TRIGGER update_contactos_directorio_updated_at
BEFORE UPDATE ON public.contactos_directorio
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();