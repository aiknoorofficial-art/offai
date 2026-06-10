CREATE TABLE public.whatsapp_block_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  target_number TEXT NOT NULL,
  target_name TEXT NOT NULL,
  comment TEXT,
  plan TEXT NOT NULL,
  amount_pkr INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_block_requests TO authenticated;
GRANT ALL ON public.whatsapp_block_requests TO service_role;

ALTER TABLE public.whatsapp_block_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own block requests"
  ON public.whatsapp_block_requests FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users create own block requests"
  ON public.whatsapp_block_requests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins update block requests"
  ON public.whatsapp_block_requests FOR UPDATE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete block requests"
  ON public.whatsapp_block_requests FOR DELETE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_whatsapp_block_requests_updated_at
  BEFORE UPDATE ON public.whatsapp_block_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();