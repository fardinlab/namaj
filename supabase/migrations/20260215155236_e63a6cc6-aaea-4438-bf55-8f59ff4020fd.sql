CREATE POLICY "Authenticated users can update member photos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'member-photos' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'member-photos' AND auth.role() = 'authenticated');