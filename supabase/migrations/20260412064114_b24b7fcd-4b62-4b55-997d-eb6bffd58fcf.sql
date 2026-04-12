
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS payment_method text;

-- Update existing rows to have defaults where null
UPDATE public.courses SET account_name = 'Not Set' WHERE account_name IS NULL;
UPDATE public.courses SET account_number = 'Not Set' WHERE account_number IS NULL;
UPDATE public.courses SET payment_method = 'Easypaisa' WHERE payment_method IS NULL;
