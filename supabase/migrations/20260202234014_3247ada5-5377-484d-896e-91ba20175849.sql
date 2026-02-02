-- Add socio_id to link messages to specific member conversations
ALTER TABLE public.mensajes_chat 
ADD COLUMN socio_id UUID REFERENCES public.socios(id) ON DELETE CASCADE;

-- Update RLS policies for private conversations
DROP POLICY IF EXISTS "Socios can view all messages" ON public.mensajes_chat;
DROP POLICY IF EXISTS "Socios can insert own messages" ON public.mensajes_chat;

-- Socios can only view their own conversation
CREATE POLICY "Socios can view own conversation"
ON public.mensajes_chat
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'junta'::app_role) OR
  (has_role(auth.uid(), 'socio'::app_role) AND socio_id IN (
    SELECT id FROM public.socios WHERE user_id = auth.uid()
  ))
);

-- Socios can insert messages in their own conversation
CREATE POLICY "Socios can insert in own conversation"
ON public.mensajes_chat
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'junta'::app_role) OR
    (has_role(auth.uid(), 'socio'::app_role) AND socio_id IN (
      SELECT id FROM public.socios WHERE user_id = auth.uid()
    ))
  )
);

-- Create index for faster queries
CREATE INDEX idx_mensajes_chat_socio_id ON public.mensajes_chat(socio_id);