CREATE TABLE otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX otp_codes_phone_idx ON otp_codes (phone);

ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
