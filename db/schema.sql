create table if not exists content (
  key text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists daily_logs (
  date date primary key,
  training_done boolean not null default false,
  exercises_done jsonb not null default '{}'::jsonb,
  activity_choice text,
  meals jsonb not null default '{}'::jsonb,
  supplements jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
