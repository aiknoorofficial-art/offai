
DROP POLICY IF EXISTS "Public can read dad bucket" ON storage.objects;
CREATE POLICY "Public can read dad bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'dad');
