-- Create developer_bio table for editable developer information
CREATE TABLE public.developer_bio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Fardin Sagor',
  title text NOT NULL DEFAULT 'Computer Engineering Student & Developer',
  bio text NOT NULL DEFAULT 'I am a passionate computer engineering student with expertise in software development, digital marketing, and SEO.',
  photo_url text,
  telegram_url text DEFAULT 'https://t.me/fardin_sagor',
  facebook_url text DEFAULT 'https://facebook.com/fardin.sagor',
  phone text DEFAULT '+8801XXXXXXXXX',
  email text,
  skills text[] DEFAULT ARRAY['Software Development', 'Digital Marketing', 'SEO'],
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.developer_bio ENABLE ROW LEVEL SECURITY;

-- Everyone can view developer bio
CREATE POLICY "Anyone can view developer bio"
ON public.developer_bio
FOR SELECT
USING (true);

-- Only admins can update developer bio
CREATE POLICY "Admins can update developer bio"
ON public.developer_bio
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Only admins can insert developer bio
CREATE POLICY "Admins can insert developer bio"
ON public.developer_bio
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert default developer bio
INSERT INTO public.developer_bio (name, title, bio, telegram_url, facebook_url, phone, skills)
VALUES (
  'Fardin Sagor',
  'Computer Engineering Student & Developer',
  'আমি একজন কম্পিউটার ইঞ্জিনিয়ারিং ছাত্র। সফটওয়্যার ডেভেলপমেন্ট, ডিজিটাল মার্কেটিং এবং SEO তে আমার দক্ষতা রয়েছে। নামাজ ক্যাম্পেইন অ্যাপটি তৈরি করেছি মুসলিম ভাইবোনদের নামাজে উৎসাহিত করার জন্য।',
  'https://t.me/fardin_sagor',
  'https://facebook.com/fardin.sagor',
  '+8801XXXXXXXXX',
  ARRAY['Software Development', 'Web Development', 'Digital Marketing', 'SEO', 'React', 'TypeScript']
);