-- Create table to store analytics snapshots
CREATE TABLE public.analytics_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha DATE NOT NULL,
  visitors INTEGER NOT NULL DEFAULT 0,
  pageviews INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(fecha)
);

-- Enable RLS
ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;

-- Only junta and admin can view analytics
CREATE POLICY "Junta and admin can view analytics" 
ON public.analytics_snapshots 
FOR SELECT 
USING (
  has_role(auth.uid(), 'junta'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Create table for aggregated analytics summary
CREATE TABLE public.analytics_summary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  total_visitors INTEGER NOT NULL DEFAULT 0,
  total_pageviews INTEGER NOT NULL DEFAULT 0,
  avg_pageviews_per_visit DECIMAL(10,2) NOT NULL DEFAULT 0,
  avg_session_duration INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analytics_summary ENABLE ROW LEVEL SECURITY;

-- Only junta and admin can view summary
CREATE POLICY "Junta and admin can view analytics summary" 
ON public.analytics_summary 
FOR SELECT 
USING (
  has_role(auth.uid(), 'junta'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);