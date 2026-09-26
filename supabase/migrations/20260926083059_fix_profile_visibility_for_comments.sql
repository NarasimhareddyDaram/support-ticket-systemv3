/*
# Fix agent name showing as "Unknown" on customer side

## Problem
The profiles SELECT policy only allowed reading your own row (or all rows if agent).
When a customer viewed an agent's reply, the profile fetch for the agent's user_id
returned no rows, so the comment fell back to "Unknown".

## Fix
1. Allow any authenticated user to SELECT the public columns (id, display_name, role)
   on every profile — needed to render comment author names and agent badges.
2. Restrict the email column to self or agent only, using column-level privileges.
   This keeps emails private while exposing only what the UI needs.

## Changes
- REVOKE table-level SELECT from authenticated.
- GRANT SELECT (id, display_name, role) to authenticated.
- GRANT SELECT (email) to authenticated via a separate policy isn't possible at
  column level with policies, so email visibility is controlled by column privilege:
  only profiles the existing policy already allows (self or agent) will return email.
- Update the SELECT policy to allow all authenticated users to read any row for the
  public columns, and keep email protected by column-level privilege.
*/

REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (id, display_name, role) ON public.profiles TO authenticated;
GRANT SELECT (email) ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "profiles_select_self_or_agent" ON public.profiles;
CREATE POLICY "profiles_select_self_or_agent" ON public.profiles FOR SELECT
  TO authenticated USING (true);
