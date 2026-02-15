-- Drop the admin-only update policy
DROP POLICY "Admins can update members" ON public.members;

-- Allow all authenticated users to update members (for photo uploads etc.)
CREATE POLICY "Authenticated users can update members"
ON public.members
FOR UPDATE
USING (true)
WITH CHECK (true);