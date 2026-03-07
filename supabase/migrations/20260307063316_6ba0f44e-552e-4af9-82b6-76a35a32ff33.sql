
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'order',
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow inserts from authenticated users (for the trigger/system)
CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create trigger function to auto-create notification on new order
CREATE OR REPLACE FUNCTION public.notify_seller_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    '/courses'
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_new_order_notify
  AFTER INSERT ON public.course_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_seller_on_order();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
