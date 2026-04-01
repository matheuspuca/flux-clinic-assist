
-- Superadmins table
CREATE TABLE public.superadmins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.superadmins ENABLE ROW LEVEL SECURITY;

-- Only superadmins can view the table
CREATE POLICY "Superadmins can view superadmins"
  ON public.superadmins FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.superadmins sa
      WHERE sa.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Security definer function to check superadmin status
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.superadmins sa
    JOIN auth.users u ON u.email = sa.email
    WHERE u.id = _user_id
  )
$$;

-- Seed the first superadmin
INSERT INTO public.superadmins (email) VALUES ('matheus.dinaser@gmail.com');

-- Allow superadmins to read ALL clinics
CREATE POLICY "Superadmins can view all clinics"
  ON public.clinics FOR SELECT TO authenticated
  USING (public.is_superadmin(auth.uid()));

-- Allow superadmins to read ALL profiles
CREATE POLICY "Superadmins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.is_superadmin(auth.uid()));

-- Allow superadmins to read ALL appointments
CREATE POLICY "Superadmins can view all appointments"
  ON public.appointments FOR SELECT TO authenticated
  USING (public.is_superadmin(auth.uid()));

-- Allow superadmins to read ALL chatbot_logs
CREATE POLICY "Superadmins can view all chatbot logs"
  ON public.chatbot_logs FOR SELECT TO authenticated
  USING (public.is_superadmin(auth.uid()));

-- Allow superadmins to read ALL clinic_settings
CREATE POLICY "Superadmins can view all clinic settings"
  ON public.clinic_settings FOR SELECT TO authenticated
  USING (public.is_superadmin(auth.uid()));

-- Allow superadmins to read ALL user_roles
CREATE POLICY "Superadmins can view all user roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.is_superadmin(auth.uid()));

-- Allow superadmins to read ALL services
CREATE POLICY "Superadmins can view all services"
  ON public.services FOR SELECT TO authenticated
  USING (public.is_superadmin(auth.uid()));

-- Allow superadmins to read ALL professionals
CREATE POLICY "Superadmins can view all professionals"
  ON public.professionals FOR SELECT TO authenticated
  USING (public.is_superadmin(auth.uid()));
