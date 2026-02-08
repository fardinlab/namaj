-- Create storage bucket for member photos
INSERT INTO storage.buckets (id, name, public) VALUES ('member-photos', 'member-photos', true);

-- Storage policies for member photos
CREATE POLICY "Anyone can view member photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'member-photos');

CREATE POLICY "Authenticated users can upload member photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'member-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can delete member photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'member-photos' AND public.has_role(auth.uid(), 'admin'));

-- Create members table
CREATE TABLE public.members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on members
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Members RLS policies
CREATE POLICY "Anyone authenticated can view members"
ON public.members FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert members"
ON public.members FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can update members"
ON public.members FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete members"
ON public.members FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create attendance/prayer records table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  fajr BOOLEAN NOT NULL DEFAULT false,
  zuhr BOOLEAN NOT NULL DEFAULT false,
  asr BOOLEAN NOT NULL DEFAULT false,
  maghrib BOOLEAN NOT NULL DEFAULT false,
  isha BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(member_id, date)
);

-- Enable RLS on attendance
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Attendance RLS policies
CREATE POLICY "Anyone authenticated can view attendance"
ON public.attendance FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert attendance"
ON public.attendance FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update attendance"
ON public.attendance FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Admins can delete attendance"
ON public.attendance FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create campaign config table (single row)
CREATE TABLE public.campaign_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  start_date DATE NOT NULL DEFAULT '2026-02-04',
  end_date DATE NOT NULL DEFAULT '2026-03-25',
  streak_target INTEGER NOT NULL DEFAULT 41,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on campaign_config
ALTER TABLE public.campaign_config ENABLE ROW LEVEL SECURITY;

-- Campaign config RLS policies
CREATE POLICY "Anyone authenticated can view campaign config"
ON public.campaign_config FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can update campaign config"
ON public.campaign_config FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert campaign config"
ON public.campaign_config FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default campaign config
INSERT INTO public.campaign_config (start_date, end_date, streak_target) 
VALUES ('2026-02-04', '2026-03-25', 41);

-- Enable realtime for attendance (for live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE public.members;