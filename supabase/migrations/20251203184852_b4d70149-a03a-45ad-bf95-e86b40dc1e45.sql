-- Create table for notifications
CREATE TABLE public.notificaciones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  solo_junta BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table to track read notifications per user
CREATE TABLE public.notificaciones_leidas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notificacion_id UUID NOT NULL REFERENCES public.notificaciones(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  leida_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(notificacion_id, user_id)
);

-- Enable RLS
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones_leidas ENABLE ROW LEVEL SECURITY;

-- Policies for notificaciones
CREATE POLICY "Admins can manage notificaciones insert"
ON public.notificaciones FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage notificaciones delete"
ON public.notificaciones FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Socios can view notificaciones"
ON public.notificaciones FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'junta'::app_role) OR 
  (has_role(auth.uid(), 'socio'::app_role) AND solo_junta = false)
);

-- Policies for notificaciones_leidas
CREATE POLICY "Users can insert own read status"
ON public.notificaciones_leidas FOR INSERT
WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'socio'::app_role));

CREATE POLICY "Users can view own read status"
ON public.notificaciones_leidas FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));