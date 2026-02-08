-- Create table to store email verification codes
CREATE TABLE public.email_verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(email, code)
);

-- Enable RLS
ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert verification codes (for signup flow)
CREATE POLICY "Anyone can insert verification codes"
ON public.email_verification_codes
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anonymous users to select their own codes (for verification)
CREATE POLICY "Anyone can select verification codes by email"
ON public.email_verification_codes
FOR SELECT
TO anon
USING (true);

-- Allow anonymous users to update codes (to mark as verified)
CREATE POLICY "Anyone can update verification codes"
ON public.email_verification_codes
FOR UPDATE
TO anon
USING (true);

-- Create function to clean up expired codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_verification_codes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.email_verification_codes
  WHERE expires_at < now() OR verified = true;
  RETURN NEW;
END;
$$;

-- Create trigger to clean up on insert
CREATE TRIGGER cleanup_verification_codes_trigger
AFTER INSERT ON public.email_verification_codes
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_expired_verification_codes();