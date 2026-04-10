INSERT INTO storage.buckets (id, name, public) VALUES ('fotos-junta', 'fotos-junta', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read fotos-junta" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'fotos-junta');

CREATE POLICY "Authenticated upload fotos-junta" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'fotos-junta');