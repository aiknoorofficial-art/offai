-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  file_url TEXT,
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view all courses"
ON public.courses FOR SELECT
USING (true);

CREATE POLICY "Users can create their own courses"
ON public.courses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own courses"
ON public.courses FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own courses"
ON public.courses FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for course files
INSERT INTO storage.buckets (id, name, public) VALUES ('courses', 'courses', true);

-- Storage policies
CREATE POLICY "Anyone can view course files"
ON storage.objects FOR SELECT
USING (bucket_id = 'courses');

CREATE POLICY "Authenticated users can upload course files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'courses' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own course files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'courses' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own course files"
ON storage.objects FOR DELETE
USING (bucket_id = 'courses' AND auth.uid()::text = (storage.foldername(name))[1]);