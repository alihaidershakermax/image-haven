
CREATE TABLE IF NOT EXISTS public.dashboard_access (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  password_hash text NOT NULL,
  salt text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- default password is 'unposed' (sha-256 of salt + password)
-- salt: 'unposed-default-salt'
-- hash computed below in plpgsql
DO $$
DECLARE
  s text := 'unposed-default-salt';
  pw text := 'unposed';
  h text;
BEGIN
  h := encode(digest(s || pw, 'sha256'), 'hex');
  INSERT INTO public.dashboard_access (id, password_hash, salt)
  VALUES (1, h, s)
  ON CONFLICT (id) DO NOTHING;
END $$;

ALTER TABLE public.dashboard_access ENABLE ROW LEVEL SECURITY;
-- intentionally NO policies: only service role (server) may read/write
