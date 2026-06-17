
-- 1) Reset privileges on public.courses so column-level revoke actually applies.
REVOKE ALL ON public.courses FROM anon, authenticated;

-- Re-grant write privileges that the app needs (RLS still gates rows).
GRANT INSERT, UPDATE, DELETE ON public.courses TO authenticated;

-- Re-grant SELECT only on safe columns (omit file_url and file_name).
GRANT SELECT (id, user_id, title, description, image_url, price, created_at, updated_at)
  ON public.courses TO anon, authenticated;

-- service_role retains full access.
GRANT ALL ON public.courses TO service_role;

-- 2) Lock down SECURITY DEFINER functions exposed via PostgREST.
-- Trigger-only functions: no one should call them via the API.
REVOKE EXECUTE ON FUNCTION public.notify_user_on_wingo_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_seller_on_order() FROM PUBLIC, anon, authenticated;

-- has_role is only used inside RLS policies (policy evaluation does not require caller EXECUTE).
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

-- get_course_file_url is called via RPC by signed-in users; keep authenticated, drop anon/public.
REVOKE EXECUTE ON FUNCTION public.get_course_file_url(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_course_file_url(uuid) TO authenticated, service_role;
