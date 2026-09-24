create table if not exists users (
  id text primary key,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists content (
  user_id text not null,
  key text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

create table if not exists daily_logs (
  user_id text not null,
  date date not null,
  training_done boolean not null default false,
  exercises_done jsonb not null default '{}'::jsonb,
  activity_choice text,
  meals jsonb not null default '{}'::jsonb,
  supplements jsonb not null default '{}'::jsonb,
  note text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

-- Migration from the single-user schema: existing rows belong to Clayton.
alter table content add column if not exists user_id text not null default 'clayton';
alter table daily_logs add column if not exists user_id text not null default 'clayton';
alter table daily_logs add column if not exists note text not null default '';
