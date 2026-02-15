-- 1. Fix members UPDATE: only admin or creator can update
DROP POLICY "Authenticated users can update members" ON public.members;

CREATE POLICY "Admins or creator can update members"
ON public.members
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR auth.uid() = created_by
);

-- 2. Fix members INSERT: ensure created_by is set to current user
DROP POLICY "Authenticated users can insert members" ON public.members;

CREATE POLICY "Authenticated users can insert members"
ON public.members
FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- 3. Fix attendance INSERT
DROP POLICY "Authenticated users can insert attendance" ON public.attendance;

CREATE POLICY "Authenticated users can insert attendance"
ON public.attendance
FOR INSERT
WITH CHECK (auth.uid() = updated_by OR updated_by IS NULL);

-- 4. Fix attendance UPDATE
DROP POLICY "Authenticated users can update attendance" ON public.attendance;

CREATE POLICY "Authenticated users can update attendance"
ON public.attendance
FOR UPDATE
USING (auth.uid() = updated_by OR updated_by IS NULL);