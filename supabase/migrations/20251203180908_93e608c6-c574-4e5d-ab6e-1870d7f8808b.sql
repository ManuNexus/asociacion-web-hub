-- Add 'solo_junta' field to eventos, documentos_internos, and votaciones
ALTER TABLE public.eventos ADD COLUMN solo_junta BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.documentos_internos ADD COLUMN solo_junta BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.votaciones ADD COLUMN solo_junta BOOLEAN NOT NULL DEFAULT false;

-- Drop existing SELECT policies and recreate with junta logic
DROP POLICY IF EXISTS "Socios can view eventos" ON public.eventos;
DROP POLICY IF EXISTS "Socios can view documentos" ON public.documentos_internos;
DROP POLICY IF EXISTS "Socios can view votaciones" ON public.votaciones;
DROP POLICY IF EXISTS "Socios can view opciones" ON public.opciones_votacion;

-- Eventos: socios see non-junta, junta sees all
CREATE POLICY "Socios can view eventos" ON public.eventos
FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  (has_role(auth.uid(), 'junta'::app_role)) OR
  (has_role(auth.uid(), 'socio'::app_role) AND solo_junta = false)
);

-- Documentos: socios see non-junta, junta sees all
CREATE POLICY "Socios can view documentos" ON public.documentos_internos
FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  (has_role(auth.uid(), 'junta'::app_role)) OR
  (has_role(auth.uid(), 'socio'::app_role) AND solo_junta = false)
);

-- Votaciones: socios see non-junta, junta sees all
CREATE POLICY "Socios can view votaciones" ON public.votaciones
FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  (has_role(auth.uid(), 'junta'::app_role)) OR
  (has_role(auth.uid(), 'socio'::app_role) AND solo_junta = false)
);

-- Opciones votacion: based on parent votacion visibility
CREATE POLICY "Socios can view opciones" ON public.opciones_votacion
FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'junta'::app_role) OR
  (has_role(auth.uid(), 'socio'::app_role) AND EXISTS (
    SELECT 1 FROM public.votaciones v 
    WHERE v.id = votacion_id AND v.solo_junta = false
  ))
);