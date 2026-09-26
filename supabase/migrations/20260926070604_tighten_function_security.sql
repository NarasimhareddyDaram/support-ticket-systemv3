/*
# Tighten function security

1. Functions Modified
- `touch_ticket_updated_at`: add SET search_path = public, switch to SECURITY INVOKER.
- `handle_new_user`: revoke EXECUTE from anon and authenticated (trigger-only).
- `is_support_agent`: revoke EXECUTE from anon explicitly, keep authenticated grant.

2. Security
- Prevents unauthenticated callers from invoking SECURITY DEFINER functions via the REST API.
- Removes mutable search_path warning on trigger function.
*/

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.is_support_agent() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_support_agent() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_support_agent() TO authenticated;

CREATE OR REPLACE FUNCTION public.touch_ticket_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
