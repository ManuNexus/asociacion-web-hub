ALTER TABLE public.socios
  ADD COLUMN IF NOT EXISTS estado_suscripcion_stripe text,
  ADD COLUMN IF NOT EXISTS ultimo_pago_tarjeta timestamp with time zone,
  ADD COLUMN IF NOT EXISTS proximo_pago_tarjeta timestamp with time zone,
  ADD COLUMN IF NOT EXISTS ultima_sync_stripe timestamp with time zone;