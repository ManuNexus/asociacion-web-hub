-- Add 'socio' role to the existing enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'socio';