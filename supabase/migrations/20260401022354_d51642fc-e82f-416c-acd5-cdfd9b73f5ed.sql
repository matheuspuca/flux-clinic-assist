
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'hsl(220, 70%, 50%)';
