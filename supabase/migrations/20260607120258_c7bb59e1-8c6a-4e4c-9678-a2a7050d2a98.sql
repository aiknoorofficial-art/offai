
-- 1) Hide file_url column from anon/authenticated; expose via SECURITY DEFINER function
REVOKE SELECT (file_url) ON public.courses FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_course_file_url(_course_id uuid)
RETURNS TABLE(file_url text, file_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.file_url, c.file_name
  FROM public.courses c
  WHERE c.id = _course_id
    AND (
      c.user_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.course_orders o
        WHERE o.course_id = c.id
          AND o.buyer_id = auth.uid()
          AND o.status IN ('accepted', 'approved')
      )
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_course_file_url(uuid) TO authenticated;

-- 2) Tighten course_payment_details INSERT/UPDATE to verify seller owns the course
DROP POLICY IF EXISTS "Sellers can insert their payment details" ON public.course_payment_details;
CREATE POLICY "Sellers can insert their payment details"
ON public.course_payment_details
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = seller_id
  AND EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_id AND c.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Sellers can update their payment details" ON public.course_payment_details;
CREATE POLICY "Sellers can update their payment details"
ON public.course_payment_details
FOR UPDATE
TO authenticated
USING (auth.uid() = seller_id)
WITH CHECK (
  auth.uid() = seller_id
  AND EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_id AND c.user_id = auth.uid()
  )
);
