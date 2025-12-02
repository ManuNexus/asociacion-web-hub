-- Create table for membership requests
CREATE TABLE public.solicitudes_socio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  dni TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT,
  direccion TEXT,
  codigo_postal TEXT,
  ciudad TEXT,
  provincia TEXT,
  motivacion TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.solicitudes_socio ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (public form)
CREATE POLICY "Anyone can submit membership request"
ON public.solicitudes_socio
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy: Only admins can view requests
CREATE POLICY "Admins can view membership requests"
ON public.solicitudes_socio
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Only admins can update requests
CREATE POLICY "Admins can update membership requests"
ON public.solicitudes_socio
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Only admins can delete requests
CREATE POLICY "Admins can delete membership requests"
ON public.solicitudes_socio
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_solicitudes_socio_updated_at
BEFORE UPDATE ON public.solicitudes_socio
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();