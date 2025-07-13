-- Block 39A Implementation: Postgres schema for vaults and logs tables
CREATE TABLE IF NOT EXISTS vaults (
  vault_id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  beliefs JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS logs (
  log_id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  payload JSONB,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
); 