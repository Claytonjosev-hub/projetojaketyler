import { sql } from "@vercel/postgres";

const statements = [
  `create table if not exists users (
     id text primary key,
     name text not null,
     sort_order int not null default 0,
     created_at timestamptz not null default now()
   )`,
  `insert into users (id, name, sort_order) values ('clayton', 'Clayton', 1)
     on conflict (id) do nothing`,
  `insert into users (id, name, sort_order) values ('arthur', 'Arthur', 2)
     on conflict (id) do nothing`,
  `alter table content add column if not exists user_id text not null default 'clayton'`,
  `alter table daily_logs add column if not exists user_id text not null default 'clayton'`,
  `alter table content drop constraint if exists content_pkey`,
  `alter table content add primary key (user_id, key)`,
  `alter table daily_logs drop constraint if exists daily_logs_pkey`,
  `alter table daily_logs add primary key (user_id, date)`,
];

for (const statement of statements) {
  await sql.query(statement);
  console.log("ok:", statement.split("\n")[0].trim().slice(0, 70));
}

const users = await sql`select id, name from users order by sort_order`;
console.table(users.rows);
const content = await sql`select user_id, key from content order by user_id, key`;
console.table(content.rows);
const logs = await sql`select user_id, count(*)::int as days from daily_logs group by user_id`;
console.table(logs.rows);
