-- Create table for junta calendar events
CREATE TABLE public.calendario_junta (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha TIMESTAMP WITH TIME ZONE NOT NULL,
  fecha_fin TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.calendario_junta ENABLE ROW LEVEL SECURITY;

-- Only junta and admin can view
CREATE POLICY "Junta can view calendario"
ON public.calendario_junta
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'junta'::app_role));

-- Only admin and directivos can insert
CREATE POLICY "Directivos can insert calendario"
ON public.calendario_junta
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_cargo_directivo(auth.uid()));

-- Only admin and directivos can update
CREATE POLICY "Directivos can update calendario"
ON public.calendario_junta
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_cargo_directivo(auth.uid()));

-- Only admin and directivos can delete
CREATE POLICY "Directivos can delete calendario"
ON public.calendario_junta
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_cargo_directivo(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_calendario_junta_updated_at
BEFORE UPDATE ON public.calendario_junta
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();