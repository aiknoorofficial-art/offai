
CREATE TABLE public.wingo_access_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tx_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_account TEXT NOT NULL,
  receiver_name TEXT NOT NULL,
  receiver_account TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wingo_access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own wingo requests"
ON public.wingo_access_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own wingo requests"
ON public.wingo_access_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wingo requests"
ON public.wingo_access_requests FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update wingo requests"
ON public.wingo_access_requests FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_wingo_access_requests_updated_at
BEFORE UPDATE ON public.wingo_access_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.notify_user_on_wingo_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status <> OLD.status THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      CASE WHEN NEW.status = 'approved' THEN 'Wingo Signal Approved' ELSE 'Wingo Signal Update' END,
      CASE WHEN NEW.status = 'approved'
           THEN 'Your Wingo signal access has been approved. Predictions are now unlocked.'
           ELSE 'Your Wingo signal request status: ' || NEW.status END,
      'wingo',
      '/generate'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER wingo_status_notify
AFTER UPDATE ON public.wingo_access_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_user_on_wingo_status();
