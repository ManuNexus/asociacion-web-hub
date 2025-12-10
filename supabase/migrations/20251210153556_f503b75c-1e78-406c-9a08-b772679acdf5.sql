-- Add new columns for payment preferences and bank details to solicitudes_socio
ALTER TABLE public.solicitudes_socio 
ADD COLUMN IF NOT EXISTS tipo_pago text NOT NULL DEFAULT 'mensual',
ADD COLUMN IF NOT EXISTS iban text,
ADD COLUMN IF NOT EXISTS titular_cuenta text;

-- Add comment for documentation
COMMENT ON COLUMN public.solicitudes_socio.tipo_pago IS 'Payment type: mensual (5€/month) or anual (50€/year)';
COMMENT ON COLUMN public.solicitudes_socio.iban IS 'Bank account IBAN for direct debit';
COMMENT ON COLUMN public.solicitudes_socio.titular_cuenta IS 'Account holder name if different from member';

-- Also update socios table to track payment type
ALTER TABLE public.socios
ADD COLUMN IF NOT EXISTS tipo_pago text NOT NULL DEFAULT 'mensual',
ADD COLUMN IF NOT EXISTS iban text,
ADD COLUMN IF NOT EXISTS titular_cuenta text;

COMMENT ON COLUMN public.socios.tipo_pago IS 'Payment type: mensual (5€/month) or anual (50€/year)';
COMMENT ON COLUMN public.socios.iban IS 'Bank account IBAN for direct debit';
COMMENT ON COLUMN public.socios.titular_cuenta IS 'Account holder name if different from member';