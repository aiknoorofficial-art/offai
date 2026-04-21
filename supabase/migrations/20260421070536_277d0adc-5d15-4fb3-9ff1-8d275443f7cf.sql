
-- 1. Tighten payment details: only accepted/approved orders
DROP POLICY IF EXISTS "Buyers with accepted orders can view payment details" ON public.course_payment_details;
CREATE POLICY "Buyers with accepted orders can view payment details"
ON public.course_payment_details FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.course_orders
    WHERE course_orders.course_id = course_payment_details.course_id
      AND course_orders.buyer_id = auth.uid()
      AND course_orders.status IN ('accepted','approved')
  )
);

-- 2. Drop loose courses bucket upload policy if it exists
DROP POLICY IF EXISTS "Authenticated users can upload course files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to courses bucket" ON storage.objects;

-- 3. Lock referrals: only admins can change commission/status
DROP POLICY IF EXISTS "System can update referrals" ON public.referrals;
CREATE POLICY "Admins can update referrals"
ON public.referrals FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 4. Realtime: restrict subscriptions to own user's notification topic
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can subscribe to own notifications channel" ON realtime.messages;
CREATE POLICY "Users can subscribe to own notifications channel"
ON realtime.messages FOR SELECT
TO authenticated
USING (
  realtime.topic() = ('user:' || auth.uid()::text)
  OR realtime.topic() LIKE 'notifications%'
);
