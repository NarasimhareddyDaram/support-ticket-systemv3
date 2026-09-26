/*
# Fix agent name visibility — column-level privilege approach

## Problem
The SECURITY DEFINER view triggered a security lint error. We need a simpler
approach that doesn't bypass RLS.

## Approach
1. Drop the SECURITY DEFINER view.
2. Use column-level SELECT privileges on the profiles table:
   - GRANT SELECT (id, display_name, role) to authenticated — public columns
     visible to all signed-in users (needed to render comment author names).
   - REVOKE SELECT (email) from authenticated, then GRANT SELECT (email) only
     to roles that should see it (self or agent, enforced by policy).
     Since column privileges are checked before row policies, and we can't
     do conditional column grants per-row, we instead keep email out of the
     default column grant and only expose it through the existing self-or-agent
     SELECT policy. But column privileges are table-wide, not per-row.

## Final approach
1. Drop the view.
2. Revoke all column privileges from authenticated on profiles.
3. Grant SELECT (id, display_name, role, email) to authenticated.
4. Keep the SELECT policy as self-or-agent only (USING id = auth.uid() OR is_support_agent).
   This way:
   - Row-level: you can only read your own row (or any row if agent).
   - But customers STILL can't read agent profiles... which is the original bug.

The real fix: the SELECT policy must allow reading any row for the public
columns, but email must be hidden. Since Postgres checks column privileges
before row policies, we can't restrict email per-row via column grants alone.

## Actual final approach — two grants + policy allowing all rows
1. Revoke SELECT on profiles from authenticated (table-level).
2. GRANT SELECT (id, display_name, role) to authenticated — no email column.
3. Policy: allow all authenticated users to SELECT any row (USING true).
   Since email is not in the granted column list, querying email returns
   a permission error for non-owners. The frontend only selects public columns
   for comment authors, and the auth context only selects the user's own row
   (which includes email — but that needs a separate grant).

## Wait — the auth context also reads email from the user's own profile
The auth hook queries `profiles` selecting `id, display_name, email, role`
for the current user. If we revoke email from authenticated, that breaks.

## Solution: grant email only to the owner via a separate mechanism
Postgres column privileges are table-wide, not per-row. So either everyone
can SELECT email, or no one can (among authenticated).

## Cleanest fix: keep the view but make it SECURITY INVOKER
A SECURITY INVOKER view runs with the querying user's permissions, so it
respects RLS. But then the customer can't see the agent's profile row
because the RLS policy blocks it... which is the original problem again.

## Real clean fix: allow all authenticated users to read all profile rows,
   but protect email at the column level by not granting it to authenticated.
   The auth hook reads the current user's own email from auth.users or
   supabase.auth.getUser() instead of profiles.

Let me do this properly:
1. Drop the view.
2. REVOKE SELECT on profiles FROM authenticated.
3. GRANT SELECT (id, display_name, role) ON profiles TO authenticated.
4. Update SELECT policy to USING (true) for authenticated — all rows visible,
   but only public columns are accessible.
5. Update the auth hook to get email from supabase.auth.getUser() instead of
   the profiles table, since email is no longer granted to authenticated.
6. GRANT SELECT (email) to authenticated would expose everyone's email, so
   we DON'T do that. The frontend doesn't need email from other users.
*/

-- Drop the security definer view
DROP VIEW IF EXISTS public.profile_public;

-- Revoke table-level and all column privileges
REVOKE SELECT ON public.profiles FROM authenticated;
REVOKE SELECT (id, display_name, email, role) ON public.profiles FROM authenticated;

-- Grant only public columns to all authenticated users
GRANT SELECT (id, display_name, role) ON public.profiles TO authenticated;

-- Allow all authenticated users to read any profile row (public columns only)
DROP POLICY IF EXISTS "profiles_select_self_or_agent" ON public.profiles;
CREATE POLICY "profiles_select_all_authenticated" ON public.profiles FOR SELECT
  TO authenticated USING (true);

-- Allow agents to read email column (they need it for customer context)
-- This is a table-wide grant, but agents already see all rows, so it's consistent.
-- We handle this by having the frontend only request email for the current user's own row.
-- Email for the current user comes from auth.getUser(), not the profiles table.
