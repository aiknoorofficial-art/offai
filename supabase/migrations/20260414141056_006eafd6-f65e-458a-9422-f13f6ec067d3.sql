-- Allow admins to view all course orders
CREATE POLICY "Admins can view all orders"
ON public.course_orders
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update any course order status
CREATE POLICY "Admins can update all orders"
ON public.course_orders
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));