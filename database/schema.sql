-- FC Sombong League Supabase/PostgreSQL schema

create table if not exists teams (
  id bigint generated always as identity primary key,
  name text not null,
  created_at timestamp default now()
);

create table if not exists players (
  id bigint generated always as identity primary key,
  name text not null,
  team_id bigint references teams(id),
  photo_url text,
  appearances int default 0,
  goals int default 0,
  created_at timestamp default now()
);

create table if not exists matches (
  id bigint generated always as identity primary key,
  match_date date not null,
  home_team_id bigint references teams(id),
  away_team_id bigint references teams(id),
  home_score int default 0,
  away_score int default 0,
  notes text,
  created_at timestamp default now()
);

create table if not exists goals (
  id bigint generated always as identity primary key,
  match_id bigint references matches(id) on delete cascade,
  player_id bigint references players(id),
  goal_count int default 1
);

create table if not exists users_fc (
  id bigint generated always as identity primary key,
  username text unique not null,
  password_hash text,
  role text default 'viewer',
  created_at timestamp default now()
);

create table if not exists settings_fc (
  id bigint generated always as identity primary key,
  league_name text default 'FC Sombong League',
  weekly_reset_day text default 'Friday'
);

insert into settings_fc (league_name, weekly_reset_day)
select 'FC Sombong League', 'Friday'
where not exists (select 1 from settings_fc);
