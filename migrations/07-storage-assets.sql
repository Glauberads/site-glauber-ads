INSERT INTO storage.buckets (id, name, public) VALUES ('site-assets', 'site-assets', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow public read site-assets" ON storage.objects;
CREATE POLICY "Allow public read site-assets" ON storage.objects FOR SELECT USING (bucket_id = 'site-assets');

DROP POLICY IF EXISTS "Allow authenticated upload site-assets" ON storage.objects;
CREATE POLICY "Allow authenticated upload site-assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'site-assets');

DROP POLICY IF EXISTS "Allow authenticated update site-assets" ON storage.objects;
CREATE POLICY "Allow authenticated update site-assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'site-assets') WITH CHECK (bucket_id = 'site-assets');

DROP POLICY IF EXISTS "Allow authenticated delete site-assets" ON storage.objects;
CREATE POLICY "Allow authenticated delete site-assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'site-assets');
