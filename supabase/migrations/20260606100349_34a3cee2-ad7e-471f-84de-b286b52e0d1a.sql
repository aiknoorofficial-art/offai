
-- 1) course-files bucket policies (private)
CREATE POLICY "Sellers can upload their own course files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'course-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Sellers can update their own course files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'course-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Sellers can delete their own course files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'course-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Course file access: owner, admin, or accepted buyer"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'course-files'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1
      FROM public.courses c
      JOIN public.course_orders o ON o.course_id = c.id
      WHERE c.file_url = storage.objects.name
        AND o.buyer_id = auth.uid()
        AND o.status IN ('accepted','approved')
    )
  )
);

-- 2) 'dad' bucket: explicit public SELECT policy
CREATE POLICY "Public read access for dad bucket"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'dad');

-- 3) Tighten referrals INSERT — referrer must be the one recorded on the referred user's profile
DROP POLICY IF EXISTS "System can insert referrals" ON public.referrals;

CREATE POLICY "Users can insert validated referral"
ON public.referrals FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = referred_id
  AND referrer_id <> referred_id
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.referred_by = referrals.referrer_id
  )
);

-- 4) Revoke EXECUTE on internal SECURITY DEFINER trigger functions
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_user_on_wingo_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_referral_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_seller_on_order() FROM PUBLIC, anon, authenticated;
