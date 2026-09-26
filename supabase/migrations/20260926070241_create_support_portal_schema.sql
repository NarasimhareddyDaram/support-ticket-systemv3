/*
# Create support ticket portal schema

1. New Tables
- `profiles`: one row per signed-in person with a display name, email, and server-controlled role.
- `tickets`: customer-owned support requests with subject, description, priority, status, and optional agent assignment.
- `ticket_comments`: conversation messages attached to tickets, authored by a signed-in person.

2. Security
- Row Level Security is enabled on every table.
- Customers can only read and change their own tickets and comments on their tickets.
- Support agents can read all tickets and comments, and update ticket workflow fields.
- Profile roles are not client-writable.

3. Important Notes
- New accounts are created as customers by default.
- An operator can promote a profile to `agent` outside the browser when provisioning staff accounts.
- Ownership columns default from `auth.uid()` so callers cannot forge ownership.
*/

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT 'New customer',
  email text NOT NULL,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'agent')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL CHECK (char_length(subject) BETWEEN 3 AND 160),
  description text NOT NULL CHECK (char_length(description) BETWEEN 10 AND 5000),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ticket_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 3000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tickets_user_id_idx ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS tickets_status_idx ON public.tickets(status);
CREATE INDEX IF NOT EXISTS tickets_updated_at_idx ON public.tickets(updated_at DESC);
CREATE INDEX IF NOT EXISTS ticket_comments_ticket_id_idx ON public.ticket_comments(ticket_id, created_at);

CREATE OR REPLACE FUNCTION public.is_support_agent()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'agent'
  );
$$;

REVOKE ALL ON FUNCTION public.is_support_agent() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_support_agent() TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'display_name', ''), 'New customer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (display_name) ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "profiles_select_self_or_agent" ON public.profiles;
CREATE POLICY "profiles_select_self_or_agent" ON public.profiles FOR SELECT
  TO authenticated USING (id = auth.uid() OR public.is_support_agent());
DROP POLICY IF EXISTS "profiles_update_self_name" ON public.profiles;
CREATE POLICY "profiles_update_self_name" ON public.profiles FOR UPDATE
  TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "tickets_select_owner_or_agent" ON public.tickets;
CREATE POLICY "tickets_select_owner_or_agent" ON public.tickets FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR public.is_support_agent());
DROP POLICY IF EXISTS "tickets_insert_owner" ON public.tickets;
CREATE POLICY "tickets_insert_owner" ON public.tickets FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "tickets_update_owner_or_agent" ON public.tickets;
CREATE POLICY "tickets_update_owner_or_agent" ON public.tickets FOR UPDATE
  TO authenticated USING (user_id = auth.uid() OR public.is_support_agent())
  WITH CHECK (user_id = auth.uid() OR public.is_support_agent());
DROP POLICY IF EXISTS "tickets_delete_owner_or_agent" ON public.tickets;
CREATE POLICY "tickets_delete_owner_or_agent" ON public.tickets FOR DELETE
  TO authenticated USING (user_id = auth.uid() OR public.is_support_agent());

DROP POLICY IF EXISTS "comments_select_ticket_access" ON public.ticket_comments;
CREATE POLICY "comments_select_ticket_access" ON public.ticket_comments FOR SELECT
  TO authenticated USING (
    public.is_support_agent() OR EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.id = ticket_comments.ticket_id AND tickets.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "comments_insert_ticket_access" ON public.ticket_comments;
CREATE POLICY "comments_insert_ticket_access" ON public.ticket_comments FOR INSERT
  TO authenticated WITH CHECK (
    user_id = auth.uid() AND (
      public.is_support_agent() OR EXISTS (
        SELECT 1 FROM public.tickets
        WHERE tickets.id = ticket_comments.ticket_id AND tickets.user_id = auth.uid()
      )
    )
  );
DROP POLICY IF EXISTS "comments_update_author" ON public.ticket_comments;
CREATE POLICY "comments_update_author" ON public.ticket_comments FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "comments_delete_author_or_agent" ON public.ticket_comments;
CREATE POLICY "comments_delete_author_or_agent" ON public.ticket_comments FOR DELETE
  TO authenticated USING (user_id = auth.uid() OR public.is_support_agent());

CREATE OR REPLACE FUNCTION public.touch_ticket_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tickets_updated_at ON public.tickets;
CREATE TRIGGER tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.touch_ticket_updated_at();