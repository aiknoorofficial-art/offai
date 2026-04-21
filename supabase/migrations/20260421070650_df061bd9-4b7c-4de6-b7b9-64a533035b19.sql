
DROP POLICY IF EXISTS "Users can create their own withdrawals" ON public.withdrawals;
CREATE POLICY "Users can create their own withdrawals"
ON public.withdrawals FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view course reviews" ON public.course_reviews;
CREATE POLICY "Authenticated users can view course reviews"
ON public.course_reviews FOR SELECT
TO authenticated
USING (true);
