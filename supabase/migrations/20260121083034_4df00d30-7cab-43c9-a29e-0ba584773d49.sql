-- Add fecha_nacimiento column to socios table
ALTER TABLE public.socios 
ADD COLUMN fecha_nacimiento date;

-- Add fecha_nacimiento column to solicitudes_socio table for new membership requests
ALTER TABLE public.solicitudes_socio 
ADD COLUMN fecha_nacimiento date;