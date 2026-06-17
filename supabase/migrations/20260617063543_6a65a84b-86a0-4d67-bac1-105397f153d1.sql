
-- 1) Create a non-exposed schema for privileged helpers.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

-- 2) Move the privileged implementation to `private` as SECURITY DEFINER.
CREATE OR REPLACE FUNCTION private.get_course_file_url(_course_id uuid)
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
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
      OR EXISTS (
        SELECT 1 FROM public.course_orders o
        WHERE o.course_id = c.id
          AND o.buyer_id = auth.uid()
          AND o.status IN ('accepted', 'approved')
      )
    );
$$;

REVOKE EXECUTE ON FUNCTION private.get_course_file_url(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.get_course_file_url(uuid) TO authenticated, service_role;

-- 3) Replace the public function with a SECURITY INVOKER wrapper so the
-- client RPC name stays the same but the public-schema function is no longer SECURITY DEFINER.
DROP FUNCTION IF EXISTS public.get_course_file_url(uuid);
CREATE OR REPLACE FUNCTION public.get_course_file_url(_course_id uuid)
RETURNS TABLE(file_url text, file_name text)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT file_url, file_name FROM private.get_course_file_url(_course_id);
$$;

REVOKE EXECUTE ON FUNCTION public.get_course_file_url(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_course_file_url(uuid) TO authenticated, service_role;
