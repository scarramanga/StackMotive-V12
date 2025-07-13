-- Block 59 Implementation
create extension if not exists "uuid-ossp";
create table if not exists brokers (
  broker_id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  broker_name text not null,
  credentials jsonb not null,
  created_at timestamp default now()
);

alter table brokers enable row level security;
create policy "Broker RLS" on brokers
  for all using (auth.uid() = user_id); 