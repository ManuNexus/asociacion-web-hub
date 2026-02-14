
ALTER TABLE public.solicitudes_socio 
ADD COLUMN ip_address text,
ADD COLUMN version_documento text DEFAULT '2025-02-14-v1';
