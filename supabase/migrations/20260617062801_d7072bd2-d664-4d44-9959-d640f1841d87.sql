
DROP POLICY IF EXISTS "Buyers can create orders" ON public.course_orders;
CREATE POLICY "Buyers can create orders"
ON public.course_orders
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = buyer_id
  AND EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_orders.course_id
      AND c.user_id = course_orders.seller_id
  )
);
