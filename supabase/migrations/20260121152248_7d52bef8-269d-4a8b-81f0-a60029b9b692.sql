-- Create orders/messages table for course orders
CREATE TABLE public.course_orders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL,
    seller_id UUID NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.course_orders ENABLE ROW LEVEL SECURITY;

-- Buyers can view their own orders
CREATE POLICY "Buyers can view their own orders"
ON public.course_orders
FOR SELECT
USING (auth.uid() = buyer_id);

-- Sellers can view orders for their courses
CREATE POLICY "Sellers can view orders for their courses"
ON public.course_orders
FOR SELECT
USING (auth.uid() = seller_id);

-- Buyers can create orders
CREATE POLICY "Buyers can create orders"
ON public.course_orders
FOR INSERT
WITH CHECK (auth.uid() = buyer_id);

-- Sellers can update order status
CREATE POLICY "Sellers can update order status"
ON public.course_orders
FOR UPDATE
USING (auth.uid() = seller_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_course_orders_updated_at
BEFORE UPDATE ON public.course_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Also fix the security issue: restrict payment info visibility
-- Create a view that hides sensitive payment data from non-owners
CREATE OR REPLACE VIEW public.courses_public AS
SELECT 
    id,
    user_id,
    title,
    description,
    price,
    file_url,
    file_name,
    image_url,
    created_at,
    updated_at,
    CASE WHEN user_id = auth.uid() THEN account_name ELSE NULL END as account_name,
    CASE WHEN user_id = auth.uid() THEN account_number ELSE NULL END as account_number
FROM public.courses;