REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

CREATE POLICY "own folder read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'observations' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own folder insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'observations' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own folder delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'observations' AND auth.uid()::text = (storage.foldername(name))[1]);