
-- 1. Create private payment details table
CREATE TABLE IF NOT EXISTS public.course_payment_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL UNIQUE REFERENCES public.courses(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL,
  account_name TEXT,
  account_number TEXT,
  payment_method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Migrate existing data
INSERT INTO public.course_payment_details (course_id, seller_id, account_name, account_number, payment_method)
SELECT id, user_id, account_name, account_number, payment_method
FROM public.courses
WHERE account_name IS NOT NULL OR account_number IS NOT NULL OR payment_method IS NOT NULL
ON CONFLICT (course_id) DO NOTHING;

-- Drop sensitive columns from public courses table
ALTER TABLE public.courses DROP COLUMN IF EXISTS account_name;
ALTER TABLE public.courses DROP COLUMN IF EXISTS account_number;
ALTER TABLE public.courses DROP COLUMN IF EXISTS payment_method;

-- Enable RLS
ALTER TABLE public.course_payment_details ENABLE ROW LEVEL SECURITY;

-- Sellers manage their own
CREATE POLICY "Sellers can view their payment details"
ON public.course_payment_details FOR SELECT
USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can insert their payment details"
ON public.course_payment_details FOR INSERT
WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their payment details"
ON public.course_payment_details FOR UPDATE
USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their payment details"
ON public.course_payment_details FOR DELETE
USING (auth.uid() = seller_id);

-- Buyers with accepted orders can view payment details
CREATE POLICY "Buyers with accepted orders can view payment details"
ON public.course_payment_details FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.course_orders
    WHERE course_orders.course_id = course_payment_details.course_id
      AND course_orders.buyer_id = auth.uid()
      AND course_orders.status IN ('pending','accepted','approved')
  )
);

-- Admins can view all
CREATE POLICY "Admins can view all payment details"
ON public.course_payment_details FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE TRIGGER update_course_payment_details_updated_at
BEFORE UPDATE ON public.course_payment_details
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Lock down user_roles: restrictive INSERT/UPDATE/DELETE (deny client writes)
CREATE POLICY "No client inserts on user_roles"
ON public.user_roles AS RESTRICTIVE FOR INSERT
TO authenticated, anon
WITH CHECK (false);

CREATE POLICY "No client updates on user_roles"
ON public.user_roles AS RESTRICTIVE FOR UPDATE
TO authenticated, anon
USING (false);

CREATE POLICY "No client deletes on user_roles"
ON public.user_roles AS RESTRICTIVE FOR DELETE
TO authenticated, anon
USING (false);

-- 3. Restrict storage bucket 'courses' uploads to user-owned folder
DROP POLICY IF EXISTS "Authenticated users can upload to courses" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload courses" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to courses" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload courses" ON storage.objects;

CREATE POLICY "Users can upload to own folder in courses"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'courses'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own files in courses"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'courses'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own files in courses"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'courses'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Restrict listing/select on courses bucket to authenticated users only
DROP POLICY IF EXISTS "Public can read courses" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view courses" ON storage.objects;

CREATE POLICY "Authenticated can read courses bucket"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'courses');
