
CREATE TABLE public.campaign_platforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.campaign_platforms TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_platforms TO authenticated;
GRANT ALL ON public.campaign_platforms TO service_role;
ALTER TABLE public.campaign_platforms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "platforms readable by everyone" ON public.campaign_platforms FOR SELECT USING (true);
CREATE POLICY "admins manage platforms" ON public.campaign_platforms FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.campaign_platforms (key, name, sort_order) VALUES
  ('whatsapp','WhatsApp',1),('tiktok','TikTok',2),('youtube','YouTube',3),('facebook','Facebook',4),
  ('website','Website',5),('x','X (Twitter)',6),('telegram','Telegram',7),('instagram','Instagram',8);

CREATE TABLE public.daily_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  daily_requirement text NOT NULL,
  daily_target integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.daily_badges TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_badges TO authenticated;
GRANT ALL ON public.daily_badges TO service_role;
ALTER TABLE public.daily_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges readable by everyone" ON public.daily_badges FOR SELECT USING (true);
CREATE POLICY "admins manage badges" ON public.daily_badges FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.daily_badges (name, description, daily_requirement, daily_target, sort_order) VALUES
  ('Starter Badge','Entry level daily plan','Complete 3 promotions per day',3,1),
  ('Growth Badge','Mid level daily plan','Complete 6 promotions per day',6,2),
  ('Pro Badge','High volume daily plan','Complete 12 promotions per day',12,3);

CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  platform_keys text[] NOT NULL DEFAULT '{}',
  badge_id uuid REFERENCES public.daily_badges(id) ON DELETE SET NULL,
  start_date date NOT NULL DEFAULT current_date,
  end_date date NOT NULL DEFAULT (current_date + 7),
  daily_status text NOT NULL DEFAULT 'pending',
  daily_progress integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT campaigns_daily_status_check CHECK (daily_status IN ('pending','active','completed')),
  CONSTRAINT campaigns_status_check CHECK (status IN ('active','paused','completed')),
  CONSTRAINT campaigns_dates_check CHECK (end_date >= start_date),
  CONSTRAINT campaigns_platforms_check CHECK (array_length(platform_keys, 1) BETWEEN 1 AND 8)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own campaigns" ON public.campaigns FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users create own campaigns" ON public.campaigns FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own campaigns" ON public.campaigns FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users delete own campaigns" ON public.campaigns FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER campaigns_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.deposit_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  account_label text NOT NULL,
  account_value text NOT NULL,
  account_holder text,
  currency text NOT NULL DEFAULT 'USD',
  min_amount numeric NOT NULL DEFAULT 20,
  instructions text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deposit_methods TO authenticated;
GRANT ALL ON public.deposit_methods TO service_role;
ALTER TABLE public.deposit_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "methods readable by signed in users" ON public.deposit_methods FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins manage methods" ON public.deposit_methods FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER deposit_methods_updated_at BEFORE UPDATE ON public.deposit_methods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.deposit_methods (key, name, account_label, account_value, account_holder, currency, min_amount, instructions, sort_order) VALUES
  ('binance','Binance','Binance UID','838179850',NULL,'USD',20,'Send USDT to the Binance UID then upload your payment screenshot',1),
  ('bank_al_habib','Bank Al Habib','IBAN','PK32BAHL5513178201028701','Muhammad Yasir','PKR',5000,'Transfer to the IBAN above then upload your payment receipt',2),
  ('easypaisa','Easypaisa','Account Number','03070529899','Muhammad Ishfaq','PKR',5000,'Send to the Easypaisa account then upload your payment screenshot',3),
  ('jazzcash','JazzCash','Account Number','03070529899','Muhammad Ishfaq','PKR',5000,'Send to the JazzCash account then upload your payment screenshot',4);

CREATE TABLE public.deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method_id uuid NOT NULL REFERENCES public.deposit_methods(id),
  method_key text NOT NULL,
  method_name text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'USD',
  sender_name text,
  sender_account text,
  transaction_id text,
  proof_path text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  rejection_reason text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.deposits TO authenticated;
GRANT ALL ON public.deposits TO service_role;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own deposits" ON public.deposits FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users create own deposits" ON public.deposits FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending' AND reviewed_by IS NULL AND reviewed_at IS NULL);
CREATE POLICY "admins review deposits" ON public.deposits FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER deposits_updated_at BEFORE UPDATE ON public.deposits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.admin_audit_logs TO authenticated;
GRANT ALL ON public.admin_audit_logs TO service_role;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins view audit logs" ON public.admin_audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins write audit logs" ON public.admin_audit_logs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND admin_id = auth.uid());

CREATE OR REPLACE FUNCTION public.notify_deposit_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('approved','rejected') THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      CASE WHEN NEW.status = 'approved' THEN 'Deposit approved' ELSE 'Deposit rejected' END,
      CASE WHEN NEW.status = 'approved'
        THEN 'Your deposit of ' || NEW.amount || ' ' || NEW.currency || ' has been approved'
        ELSE 'Your deposit was rejected: ' || COALESCE(NEW.rejection_reason, 'no reason provided')
      END,
      CASE WHEN NEW.status = 'approved' THEN 'success' ELSE 'error' END,
      '/dashboard'
    );
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER deposits_notify_review AFTER UPDATE ON public.deposits
  FOR EACH ROW EXECUTE FUNCTION public.notify_deposit_review();

CREATE POLICY "users upload own deposit proofs" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'deposit-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "users read own deposit proofs" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'deposit-proofs' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));
