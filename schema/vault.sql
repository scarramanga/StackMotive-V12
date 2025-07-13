-- Block 76 Implementation
create extension if not exists "uuid-ossp";
create table if not exists vaults (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id),
  name text not null,
  created_at timestamp default now()
);

alter table vaults enable row level security;
create policy "Vaults: only owner access" on vaults
  for all using (auth.uid() = user_id); 