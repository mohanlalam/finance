-- Migration: Make investment-documents bucket private & drop public policies
-- Ensures unauthenticated users cannot read, list, insert, update, or delete documents.

-- 1. Flip bucket visibility to private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'investment-documents';

-- 2. Drop all public policies on storage.objects for this bucket
DROP POLICY IF EXISTS "Public Read Documents" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert Documents" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Documents" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Documents" ON storage.objects;

-- 3. Confirm RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
