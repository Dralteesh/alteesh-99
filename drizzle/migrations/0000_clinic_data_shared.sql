CREATE TABLE public.clinic_data (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.clinic_data TO authenticated;
GRANT ALL ON public.clinic_data TO service_role;
ALTER TABLE public.clinic_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read clinic data" ON public.clinic_data FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'doctor'));
CREATE POLICY "staff insert clinic data" ON public.clinic_data FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'doctor'));
CREATE POLICY "staff update clinic data" ON public.clinic_data FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'doctor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'doctor'));
ALTER PUBLICATION supabase_realtime ADD TABLE public.clinic_data;