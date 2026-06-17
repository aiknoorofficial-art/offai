
-- 1) Defense in depth: revoke direct column access to sensitive file fields on courses.
REVOKE SELECT (file_url) ON public.courses FROM anon, authenticated;
REVOKE SELECT (file_name) ON public.courses FROM anon, authenticated;

-- Re-grant safe columns explicitly to authenticated so generic SELECT * still works on allowed columns.
GRANT SELECT (id, user_id, title, description, image_url, price, created_at, updated_at) ON public.courses TO anon, authenticated;

-- 2) Add a SELECT policy on storage.objects for the public 'courses' bucket
-- limited to image file extensions so any non-image uploaded by mistake is not publicly readable via RLS.
DROP POLICY IF EXISTS "Public can read course images only" ON storage.objects;
CREATE POLICY "Public can read course images only"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'courses'
  AND lower(name) ~ '\.(png|jpg|jpeg|webp|gif|svg|avif)$'
);

-- 3) Restrict uploads/updates in 'courses' bucket to image files only (in addition to existing folder ownership checks).
DROP POLICY IF EXISTS "Users can upload to own folder in courses" ON storage.objects;
CREATE POLICY "Users can upload images to own folder in courses"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'courses'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND lower(name) ~ '\.(png|jpg|jpeg|webp|gif|svg|avif)$'
);

DROP POLICY IF EXISTS "Users can update own files in courses" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own course files" ON storage.objects;
CREATE POLICY "Users can update own course images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'courses'
  AND (auth.uid())::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'courses'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND lower(name) ~ '\.(png|jpg|jpeg|webp|gif|svg|avif)$'
);
