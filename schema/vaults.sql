CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

create table vaults (
  vault_id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  beliefs jsonb not null,
  created_at timestamp default now()
);

alter table vaults enable row level security;
create policy "Vaults are accessible only by their owner"
  on vaults for all
  using (auth.uid() = user_id); 