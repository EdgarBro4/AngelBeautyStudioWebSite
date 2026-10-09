/*
# Admin auth codes table

## Purpose
Stores 6-digit one-time codes for admin email-based authentication.
Replaces the broken magic-link flow with a code-verification flow.

## New table: admin_auth_codes
- id (uuid, primary key)
- email (text, not null) — the admin email requesting a code
- code (text, not null) — the 6-digit code
- expires_at (timestamptz, not null) — when the code expires (10 min)
- used (boolean, default false) — marks a code as consumed after successful verification
- created_at (timestamptz, default now())

## Security
- RLS enabled, deny all access to anon and authenticated roles.
- Only the service role (used by edge functions) can read/write this table.
*/

CREATE TABLE IF NOT EXISTS admin_auth_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_auth_codes_email_idx ON admin_auth_codes (email);

ALTER TABLE admin_auth_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_auth_codes_deny_select" ON admin_auth_codes;
CREATE POLICY "admin_auth_codes_deny_select" ON admin_auth_codes
  FOR SELECT TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "admin_auth_codes_deny_insert" ON admin_auth_codes;
CREATE POLICY "admin_auth_codes_deny_insert" ON admin_auth_codes
  FOR INSERT TO anon, authenticated WITH CHECK (false);

DROP POLICY IF EXISTS "admin_auth_codes_deny_update" ON admin_auth_codes;
CREATE POLICY "admin_auth_codes_deny_update" ON admin_auth_codes
  FOR UPDATE TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "admin_auth_codes_deny_delete" ON admin_auth_codes;
CREATE POLICY "admin_auth_codes_deny_delete" ON admin_auth_codes
  FOR DELETE TO anon, authenticated USING (false);
