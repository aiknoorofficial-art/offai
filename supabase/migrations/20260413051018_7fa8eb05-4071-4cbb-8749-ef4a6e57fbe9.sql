
-- Add referral columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by UUID;

-- Generate referral codes for existing profiles
UPDATE public.profiles SET referral_code = UPPER(SUBSTRING(MD5(user_id::text || now()::text) FROM 1 FOR 8)) WHERE referral_code IS NULL;

-- Create referrals table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  order_id UUID REFERENCES public.course_orders(id),
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(referred_id)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view referrals they made" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "Users can view their own referred entry" ON public.referrals FOR SELECT USING (auth.uid() = referred_id);
CREATE POLICY "System can insert referrals" ON public.referrals FOR INSERT WITH CHECK (auth.uid() = referred_id);
CREATE POLICY "System can update referrals" ON public.referrals FOR UPDATE USING (auth.uid() = referred_id OR auth.uid() = referrer_id);

-- Function to auto-generate referral code on profile creation
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := UPPER(SUBSTRING(MD5(NEW.user_id::text || now()::text || random()::text) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_referral_code
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.generate_referral_code();

-- Trigger to update referrals timestamp
CREATE TRIGGER update_referrals_updated_at
BEFORE UPDATE ON public.referrals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
