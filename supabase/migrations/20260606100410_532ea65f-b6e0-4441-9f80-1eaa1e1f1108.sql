
DROP POLICY IF EXISTS "Anyone can view course files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can read courses bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for dad bucket" ON storage.objects;
