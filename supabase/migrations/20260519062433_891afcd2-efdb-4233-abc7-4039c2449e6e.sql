DROP TRIGGER IF EXISTS trg_notify_user_on_wingo_status ON public.wingo_access_requests;
CREATE TRIGGER trg_notify_user_on_wingo_status
AFTER UPDATE ON public.wingo_access_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_user_on_wingo_status();