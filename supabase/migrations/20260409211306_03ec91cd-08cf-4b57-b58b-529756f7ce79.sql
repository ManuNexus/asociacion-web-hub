
CREATE TABLE public.newsletter_semaforo (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  nombre text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (email)
);

ALTER TABLE public.newsletter_semaforo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_semaforo
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins and junta can view subscribers"
ON public.newsletter_semaforo
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'junta'::app_role));

CREATE POLICY "Admins can update subscribers"
ON public.newsletter_semaforo
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete subscribers"
ON public.newsletter_semaforo
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
