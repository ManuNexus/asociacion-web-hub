-- Add billing day column to socios table
ALTER TABLE public.socios 
ADD COLUMN dia_cobro INTEGER DEFAULT 1 CHECK (dia_cobro >= 1 AND dia_cobro <= 28);

-- Add comment explaining the column
COMMENT ON COLUMN public.socios.dia_cobro IS 'Day of the month for billing (1-28)';

-- Also add dia_cobro to solicitudes_socio for admin to set during approval
ALTER TABLE public.solicitudes_socio 
ADD COLUMN dia_cobro INTEGER DEFAULT 1 CHECK (dia_cobro >= 1 AND dia_cobro <= 28);