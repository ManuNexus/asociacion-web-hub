
-- Restaurar GRANTs faltantes en todas las tablas públicas
DO $$
DECLARE
    tbl record;
BEGIN
    FOR tbl IN
        SELECT c.relname AS table_name
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE c.relkind = 'r' AND n.nspname = 'public'
    LOOP
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', tbl.table_name);
        EXECUTE format('GRANT ALL ON public.%I TO service_role', tbl.table_name);
    END LOOP;
END;
$$;

-- Tablas con políticas explícitamente públicas (formularios anónimos)
GRANT INSERT ON public.solicitudes_socio TO anon;
GRANT INSERT ON public.amigos TO anon;
GRANT INSERT ON public.newsletter_semaforo TO anon;

-- Lecturas públicas (web pública)
GRANT SELECT ON public.noticias TO anon;
GRANT SELECT ON public.categorias_noticia TO anon;
GRANT SELECT ON public.eventos TO anon;
GRANT SELECT ON public.ahora_tv TO anon;
GRANT SELECT ON public.casos_semaforo TO anon;
GRANT SELECT ON public.civi_cache TO anon;
GRANT SELECT ON public.informe_trimestral TO anon;
GRANT SELECT ON public.redes_sociales TO anon;
GRANT SELECT ON public.analytics_summary TO anon;
GRANT SELECT ON public.analytics_snapshots TO anon;
