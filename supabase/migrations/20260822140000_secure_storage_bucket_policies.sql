-- Secure Supabase Storage Bucket Policies for investment-documents
-- Drops publicly-writable INSERT/UPDATE/DELETE policies that bypassed PIN authentication.
-- File uploads and deletes must be routed strictly through the holdings-crud Edge Function (service role).

DROP POLICY IF EXISTS "Public Insert Documents" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Documents" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Documents" ON storage.objects;

-- Ensure SELECT policy remains for reading documents via public/signed URLs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Public Read Documents'
  ) THEN
    CREATE POLICY "Public Read Documents" ON storage.objects 
      FOR SELECT 
      USING (bucket_id = 'investment-documents');
  END IF;
END $$;
