
-- Drop the permissive insert policy and replace with a restricted one
DROP POLICY "System can create notifications" ON public.notifications;

-- Only the trigger (SECURITY DEFINER) inserts, so no user-level INSERT needed
-- But we need to allow the security definer function, which bypasses RLS anyway
-- So we can simply not have an INSERT policy for regular users
