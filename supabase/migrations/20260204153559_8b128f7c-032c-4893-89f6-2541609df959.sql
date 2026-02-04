-- Add iban_reminder_sent column to track if reminder email was sent
ALTER TABLE public.solicitudes_socio 
ADD COLUMN IF NOT EXISTS iban_reminder_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS iban_submitted_at TIMESTAMP WITH TIME ZONE;