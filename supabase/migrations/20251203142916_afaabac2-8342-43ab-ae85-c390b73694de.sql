-- Add unique constraint on socios.user_id for upsert functionality
ALTER TABLE public.socios ADD CONSTRAINT socios_user_id_unique UNIQUE (user_id);