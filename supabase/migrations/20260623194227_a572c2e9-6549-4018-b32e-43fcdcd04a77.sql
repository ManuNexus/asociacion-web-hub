ALTER TABLE public.solicitudes_socio
  ADD COLUMN IF NOT EXISTS metodo_pago text NOT NULL DEFAULT 'sepa',
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_setup_intent_id text,
  ADD COLUMN IF NOT EXISTS stripe_payment_method_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS tarjeta_lista boolean NOT NULL DEFAULT false;

ALTER TABLE public.solicitudes_socio
  DROP CONSTRAINT IF EXISTS solicitudes_socio_metodo_pago_check;
ALTER TABLE public.solicitudes_socio
  ADD CONSTRAINT solicitudes_socio_metodo_pago_check
  CHECK (metodo_pago IN ('sepa','tarjeta'));

ALTER TABLE public.socios
  ADD COLUMN IF NOT EXISTS metodo_pago text,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text;