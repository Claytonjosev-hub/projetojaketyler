import { sql } from "@vercel/postgres";
import type { ContentKey, ContentShape, DailyLog, User } from "./types";

export async function listUsers(): Promise<User[]> {
  const { rows } = await sql`select id, name from users order by sort_order, name`;
  return rows.map((row) => ({ id: String(row.id), name: String(row.name) }));
}

export async function getContent<K extends ContentKey>(
  userId: string,
  key: K,
): Promise<ContentShape[K]> {
  const { rows } = await sql`
    select data from content where user_id = ${userId} and key = ${key}
  `;
  if (rows.length === 0) {
    throw new Error(`content "${key}" has not been set up for ${userId}`);
  }
  return rows[0].data as ContentShape[K];
}

export async function setContent<K extends ContentKey>(
  userId: string,
  key: K,
  data: ContentShape[K],
): Promise<void> {
  await sql`
    insert into content (user_id, key, data, updated_at)
    values (${userId}, ${key}, ${JSON.stringify(data)}::jsonb, now())
    on conflict (user_id, key) do update set data = excluded.data, updated_at = now()
  `;
}

/**
 * Every read formats `date` in SQL: the driver hands back a Date object for a
 * DATE column, and stringifying that gives "Mon Sep 21", not an ISO date.
 */
const DAILY_LOG_COLUMNS = `to_char(date, 'YYYY-MM-DD') as date, training_done,
  exercises_done, activity_choice, meals, supplements, note`;

function rowToDailyLog(row: Record<string, unknown>): DailyLog {
  return {
    date: String(row.date),
    training_done: Boolean(row.training_done),
    exercises_done: (row.exercises_done ?? {}) as Record<string, boolean>,
    activity_choice: (row.activity_choice as string | null) ?? null,
    meals: (row.meals ?? {}) as DailyLog["meals"],
    supplements: (row.supplements ?? {}) as Record<string, boolean>,
    note: (row.note as string | null) ?? "",
  };
}

export async function getDailyLog(userId: string, date: string): Promise<DailyLog | null> {
  const { rows } = await sql.query(
    `select ${DAILY_LOG_COLUMNS} from daily_logs where user_id = $1 and date = $2`,
    [userId, date],
  );
  if (rows.length === 0) return null;
  return rowToDailyLog(rows[0]);
}

/** Every log the user has between two dates, keyed by "YYYY-MM-DD". */
export async function getDailyLogRange(
  userId: string,
  from: string,
  to: string,
): Promise<Map<string, DailyLog>> {
  const { rows } = await sql.query(
    `select ${DAILY_LOG_COLUMNS} from daily_logs
     where user_id = $1 and date >= $2 and date <= $3`,
    [userId, from, to],
  );
  const logs = new Map<string, DailyLog>();
  for (const row of rows) {
    const log = rowToDailyLog(row);
    logs.set(log.date, log);
  }
  return logs;
}

export async function upsertDailyLog(
  userId: string,
  date: string,
  patch: Partial<Omit<DailyLog, "date">>,
): Promise<DailyLog> {
  const existing = (await getDailyLog(userId, date)) ?? {
    date,
    training_done: false,
    exercises_done: {},
    activity_choice: null,
    meals: {},
    supplements: {},
    note: "",
  };
  const next: DailyLog = { ...existing, ...patch, date };
  await sql`
    insert into daily_logs
      (user_id, date, training_done, exercises_done, activity_choice, meals, supplements, note, updated_at)
    values (
      ${userId},
      ${date},
      ${next.training_done},
      ${JSON.stringify(next.exercises_done)}::jsonb,
      ${next.activity_choice},
      ${JSON.stringify(next.meals)}::jsonb,
      ${JSON.stringify(next.supplements)}::jsonb,
      ${next.note},
      now()
    )
    on conflict (user_id, date) do update set
      training_done = excluded.training_done,
      exercises_done = excluded.exercises_done,
      activity_choice = excluded.activity_choice,
      meals = excluded.meals,
      supplements = excluded.supplements,
      note = excluded.note,
      updated_at = now()
  `;
  return next;
}
