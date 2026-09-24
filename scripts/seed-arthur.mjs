import { sql } from "@vercel/postgres";

const FROM = "clayton";
const TO = "arthur";
const START_DATE = process.argv[2];

if (!START_DATE) {
  console.error("uso: node scripts/seed-arthur.mjs <YYYY-MM-DD>");
  process.exit(1);
}

// Same training, same supplements, Clayton's diet as a starting point.
await sql`
  insert into content (user_id, key, data, updated_at)
  select ${TO}, key, data, now() from content where user_id = ${FROM}
  on conflict (user_id, key) do nothing
`;

// His own program window starts the day he joins.
await sql`
  update content
  set data = jsonb_set(data, '{startDate}', to_jsonb(${START_DATE}::text)), updated_at = now()
  where user_id = ${TO} and key = 'program'
`;

const { rows } = await sql`
  select user_id, key, jsonb_pretty(data) as data
  from content where user_id = ${TO} and key = 'program'
`;
console.log(rows[0]);

const summary = await sql`
  select user_id, count(*)::int as keys from content group by user_id order by user_id
`;
console.table(summary.rows);
