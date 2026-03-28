
CREATE OR REPLACE FUNCTION public.notify_seller_on_order()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  course_title TEXT;
  buyer_name TEXT;
BEGIN
  SELECT title INTO course_title FROM public.courses WHERE id = NEW.course_id;
  SELECT full_name INTO buyer_name FROM public.profiles WHERE user_id = NEW.buyer_id LIMIT 1;
  
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (
    NEW.seller_id,
    'New Order Received',
    COALESCE(buyer_name, 'Someone') || ' wants to order "' || COALESCE(course_title, 'your course') || '"',
    'order',
    '/courses?open=' || NEW.course_id::text
  );
  
  RETURN NEW;
END;
$function$;
