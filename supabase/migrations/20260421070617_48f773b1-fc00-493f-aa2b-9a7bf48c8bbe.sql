
-- 1. Tighten course_payment_details: also verify seller_id matches
DROP POLICY IF EXISTS "Buyers with accepted orders can view payment details" ON public.course_payment_details;
CREATE POLICY "Buyers with accepted orders can view payment details"
ON public.course_payment_details FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.course_orders
    WHERE course_orders.course_id = course_payment_details.course_id
      AND course_orders.seller_id = course_payment_details.seller_id
      AND course_orders.buyer_id = auth.uid()
      AND course_orders.status IN ('accepted','approved')
  )
);

-- 2. Realtime: strict per-user topic only
DROP POLICY IF EXISTS "Users can subscribe to own notifications channel" ON realtime.messages;
CREATE POLICY "Users can subscribe to own notifications channel"
ON realtime.messages FOR SELECT
TO authenticated
USING (
  realtime.topic() = ('notifications:user:' || auth.uid()::text)
);

-- 3. Lock down 'dad' storage bucket: only admins can write
CREATE POLICY "Admins can insert dad bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'dad' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update dad bucket"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'dad' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete dad bucket"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'dad' AND public.has_role(auth.uid(), 'admin'));
