CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE collaborator_permission AS ENUM ('READ', 'WRITE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(320) NOT NULL,
  display_name varchar(100) NOT NULL,
  password_hash text NOT NULL,
  role user_role NOT NULL DEFAULT 'USER',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_email_normalized CHECK (email = lower(trim(email)))
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (email);
CREATE INDEX IF NOT EXISTS users_role_idx ON users (role);
CREATE INDEX IF NOT EXISTS users_active_idx ON users (is_active);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash char(64) NOT NULL,
  expires_at timestamptz NOT NULL,
  last_used_at timestamptz NOT NULL DEFAULT now(),
  user_agent varchar(500),
  ip_address inet,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS sessions_token_hash_unique ON sessions (token_hash);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions (expires_at);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash char(64) NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS password_reset_tokens_hash_unique ON password_reset_tokens (token_hash);
CREATE INDEX IF NOT EXISTS password_reset_tokens_user_idx ON password_reset_tokens (user_id);
CREATE INDEX IF NOT EXISTS password_reset_tokens_expiry_idx ON password_reset_tokens (expires_at);

CREATE TABLE IF NOT EXISTS itineraries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title varchar(140) NOT NULL,
  destination varchar(140) NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  start_date date NOT NULL,
  end_date date NOT NULL,
  timezone varchar(80) NOT NULL DEFAULT 'Europe/Madrid',
  public_share_enabled boolean NOT NULL DEFAULT true,
  share_token_hash char(64) NOT NULL,
  share_token_hint varchar(12) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT itineraries_date_range CHECK (end_date >= start_date),
  CONSTRAINT itineraries_max_range CHECK (end_date <= start_date + 90)
);
CREATE UNIQUE INDEX IF NOT EXISTS itineraries_share_hash_unique ON itineraries (share_token_hash);
CREATE INDEX IF NOT EXISTS itineraries_owner_idx ON itineraries (owner_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS itineraries_dates_idx ON itineraries (start_date, end_date);

CREATE TABLE IF NOT EXISTS itinerary_collaborators (
  itinerary_id uuid NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission collaborator_permission NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (itinerary_id, user_id)
);
CREATE INDEX IF NOT EXISTS collaborators_user_idx ON itinerary_collaborators (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS itinerary_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id uuid NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  entry_date date NOT NULL,
  start_time time NOT NULL,
  end_time time,
  title varchar(160) NOT NULL,
  description text NOT NULL DEFAULT '',
  location varchar(180) NOT NULL DEFAULT '',
  category varchar(40) NOT NULL DEFAULT 'activity',
  sort_order integer NOT NULL DEFAULT 0,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT entry_time_range CHECK (end_time IS NULL OR end_time > start_time)
);
CREATE INDEX IF NOT EXISTS entries_itinerary_date_idx ON itinerary_entries (itinerary_id, entry_date, start_time, sort_order);
CREATE INDEX IF NOT EXISTS entries_updated_idx ON itinerary_entries (updated_at DESC);

CREATE TABLE IF NOT EXISTS audit_logs (
  id bigserial PRIMARY KEY,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action varchar(80) NOT NULL,
  entity_type varchar(80) NOT NULL,
  entity_id varchar(100),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address inet,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_actor_idx ON audit_logs (actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_entity_idx ON audit_logs (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_created_idx ON audit_logs (created_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS itineraries_set_updated_at ON itineraries;
CREATE TRIGGER itineraries_set_updated_at BEFORE UPDATE ON itineraries
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS collaborators_set_updated_at ON itinerary_collaborators;
CREATE TRIGGER collaborators_set_updated_at BEFORE UPDATE ON itinerary_collaborators
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS entries_set_updated_at ON itinerary_entries;
CREATE TRIGGER entries_set_updated_at BEFORE UPDATE ON itinerary_entries
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
