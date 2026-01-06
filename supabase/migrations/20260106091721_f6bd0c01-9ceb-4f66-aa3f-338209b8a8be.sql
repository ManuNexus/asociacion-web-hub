-- Create enum for junta board positions
CREATE TYPE public.cargo_junta AS ENUM ('presidente', 'vicepresidente', 'secretario', 'tesorero', 'vocal');

-- Add cargo_junta column to socios table
ALTER TABLE public.socios 
ADD COLUMN cargo_junta cargo_junta;

-- Create a function to check if a cargo is already assigned (for unique positions)
CREATE OR REPLACE FUNCTION public.check_cargo_junta_unique()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only check for unique cargos (not vocal, which can have multiple)
  IF NEW.cargo_junta IS NOT NULL AND NEW.cargo_junta != 'vocal' THEN
    IF EXISTS (
      SELECT 1 FROM public.socios 
      WHERE cargo_junta = NEW.cargo_junta 
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND activo = true
    ) THEN
      RAISE EXCEPTION 'El cargo de % ya está asignado a otro miembro activo', NEW.cargo_junta;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to enforce uniqueness
CREATE TRIGGER check_cargo_junta_unique_trigger
BEFORE INSERT OR UPDATE ON public.socios
FOR EACH ROW
EXECUTE FUNCTION public.check_cargo_junta_unique();

-- Create helper function to get cargo junta label
CREATE OR REPLACE FUNCTION public.get_cargo_junta_label(cargo cargo_junta)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE cargo
    WHEN 'presidente' THEN 'Presidente/a'
    WHEN 'vicepresidente' THEN 'Vicepresidente/a'
    WHEN 'secretario' THEN 'Secretario/a'
    WHEN 'tesorero' THEN 'Tesorero/a'
    WHEN 'vocal' THEN 'Vocal'
    ELSE NULL
  END;
$$;