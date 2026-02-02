-- Create chat messages table for board-member communication
CREATE TABLE public.mensajes_chat (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mensaje TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  es_junta BOOLEAN NOT NULL DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE public.mensajes_chat ENABLE ROW LEVEL SECURITY;

-- All socios can view messages (but not who sent them, handled in frontend)
CREATE POLICY "Socios can view all messages"
ON public.mensajes_chat
FOR SELECT
USING (has_role(auth.uid(), 'socio'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Socios can insert their own messages
CREATE POLICY "Socios can insert own messages"
ON public.mensajes_chat
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND 
  (has_role(auth.uid(), 'socio'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

-- Only admin can delete messages
CREATE POLICY "Admin can delete messages"
ON public.mensajes_chat
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensajes_chat;

-- Create index for faster ordering
CREATE INDEX idx_mensajes_chat_created_at ON public.mensajes_chat(created_at DESC);