-- Permisos para radar_resultados
GRANT INSERT, UPDATE ON public.radar_resultados TO anon, authenticated;
GRANT SELECT ON public.radar_resultados TO authenticated;
GRANT ALL ON public.radar_resultados TO service_role;