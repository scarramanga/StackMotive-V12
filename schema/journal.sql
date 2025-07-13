create extension if not exists "uuid-ossp";
create table journal (
  entry_id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  text text not null,
  tags text[],
  timestamp timestamp default now()
);

-- Block 61 Implementation
alter table journal enable row level security;
create policy "Journal RLS" on journal using (auth.uid() = user_id); 