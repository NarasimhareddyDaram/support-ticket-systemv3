/*
# Fix agent name showing as "Unknown" — corrected approach

## Problem
The profiles SELECT policy only allowed reading your own row (or all rows if agent).
When a customer viewed an agent's reply, the profile fetch for the agent's user_id
returned no rows, so the comment author fell back to "Unknown".

## Previous attempt (reverted)
Allowed all authenticated users to SELECT all profiles rows — but that exposed
every user's email to every other user, which is a privacy regression.

## Corrected approach
1. Restore the profiles table policy to self-or-agent only (protects email).
2. Restore column-level grants to default.
3. Create a VIEW `profile_public` exposing only id, display_name, role — no email.
   The view is SECURITY DEFINER so it bypasses RLS on the base table, but it only
   exposes non-sensitive columns.
4. Grant SELECT on the view to authenticated users.
5. Frontend will query `profile_public` instead of `profiles` when fetching
   comment author names.
*/

-- Revert over-broad policy and grants
REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "profiles_select_self_or_agent" ON public.profiles;
CREATE POLICY "profiles_select_self_or_agent" ON public.profiles FOR SELECT
  TO authenticated USING (id = auth.uid() OR public.is_support_agent());

-- Create public view with only non-sensitive columns
CREATE OR REPLACE VIEW public.profile_public AS
  SELECT id, display_name, role FROM public.profiles;

ALTER VIEW public.profile_public OWNER TO postgres;
GRANT SELECT ON public.profile_public TO authenticated;
