-- Add payment status field to socios table
ALTER TABLE public.socios ADD COLUMN al_corriente_pago BOOLEAN NOT NULL DEFAULT true;