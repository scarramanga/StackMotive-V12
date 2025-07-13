-- Block 64 Implementation
create extension if not exists "uuid-ossp";
create table signals (
  signal_id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  vault_id uuid not null,
  symbol text not null,
  signal_type text not null,
  confidence int,
  action text,
  headline text,
  source text,
  timestamp timestamp default now()
);

alter table signals enable row level security;
create policy "Signals: only owner access" on signals
  for all using (auth.uid() = user_id); 