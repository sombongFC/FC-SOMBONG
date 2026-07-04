create table if not exists app_state (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

alter table app_state enable row level security;

drop policy if exists "service role full access" on app_state;
create policy "service role full access" on app_state
  for all
  using (true)
  with check (true);
