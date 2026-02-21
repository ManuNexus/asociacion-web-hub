
-- Create amigos table for free supporters
CREATE TABLE public.amigos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefono TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.amigos ENABLE ROW LEVEL SECURITY;

-- Anyone can register as amigo (public insert)
CREATE POLICY "Anyone can register as amigo"
  ON public.amigos FOR INSERT
  WITH CHECK (true);

-- Admins can view all amigos
CREATE POLICY "Admins can view amigos"
  ON public.amigos FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete amigos
CREATE POLICY "Admins can delete amigos"
  ON public.amigos FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Prevent duplicate registrations via unique constraint on email (already added above)
