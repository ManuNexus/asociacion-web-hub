ALTER TABLE public.socios
  ADD COLUMN IF NOT EXISTS stripe_payment_method_id text,
  ADD COLUMN IF NOT EXISTS stripe_setup_intent_id text,
  ADD COLUMN IF NOT EXISTS tarjeta_lista boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS metodo_pago_activo text NOT NULL DEFAULT 'sepa',
  ADD COLUMN IF NOT EXISTS tarjeta_brand text,
  ADD COLUMN IF NOT EXISTS tarjeta_last4 text;