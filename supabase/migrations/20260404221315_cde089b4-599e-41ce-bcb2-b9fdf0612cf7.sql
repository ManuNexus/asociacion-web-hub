CREATE TABLE public.civi_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contexto TEXT NOT NULL UNIQUE,
  contenido TEXT NOT NULL,
  datos_extra JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours')
);

ALTER TABLE public.civi_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view civi_cache"
ON public.civi_cache FOR SELECT
USING (true);

CREATE POLICY "Service role can manage civi_cache"
ON public.civi_cache FOR ALL
TO service_role
USING (true)
WITH CHECK (true);