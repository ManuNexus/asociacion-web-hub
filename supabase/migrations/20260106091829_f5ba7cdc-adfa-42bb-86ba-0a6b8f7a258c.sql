-- Fix function search path warning
ALTER FUNCTION public.get_cargo_junta_label(cargo_junta) SET search_path = public;