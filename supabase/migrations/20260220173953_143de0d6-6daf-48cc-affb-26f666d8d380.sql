
-- Table for semáforo cases
CREATE TABLE public.casos_semaforo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  gravedad TEXT NOT NULL CHECK (gravedad IN ('rojo', 'ambar', 'verde')),
  ambito TEXT NOT NULL DEFAULT 'nacional' CHECK (ambito IN ('local', 'nacional')),
  fuente_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.casos_semaforo ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can view casos_semaforo"
ON public.casos_semaforo FOR SELECT
USING (true);

-- Admin CRUD
CREATE POLICY "Admins can insert casos_semaforo"
ON public.casos_semaforo FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update casos_semaforo"
ON public.casos_semaforo FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete casos_semaforo"
ON public.casos_semaforo FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Table for quarterly PDF report
CREATE TABLE public.informe_trimestral (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  archivo_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.informe_trimestral ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view informe_trimestral"
ON public.informe_trimestral FOR SELECT
USING (true);

CREATE POLICY "Admins can insert informe_trimestral"
ON public.informe_trimestral FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete informe_trimestral"
ON public.informe_trimestral FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage bucket for informes
INSERT INTO storage.buckets (id, name, public) VALUES ('informes-semaforo', 'informes-semaforo', true);

CREATE POLICY "Anyone can read informes-semaforo"
ON storage.objects FOR SELECT
USING (bucket_id = 'informes-semaforo');

CREATE POLICY "Admins can upload informes-semaforo"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'informes-semaforo' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete informes-semaforo"
ON storage.objects FOR DELETE
USING (bucket_id = 'informes-semaforo' AND has_role(auth.uid(), 'admin'::app_role));
