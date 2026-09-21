import { sql } from "@vercel/postgres";
import type { ContentKey, ContentShape, DailyLog } from "./types";

export async function getContent<K extends ContentKey>(
  key: K,
): Promise<ContentShape[K]> {
  const { rows } = await sql`select data from content where key = ${key}`;
  if (rows.length === 0) {
    throw new Error(`content key "${key}" has not been seeded yet`);
  }
  return rows[0].data as ContentShape[K];
}

export async function setContent<K extends ContentKey>(
  key: K,
  data: ContentShape[K],
): Promise<void> {
  await sql`
    insert into content (key, data, updated_at)
    values (${key}, ${JSON.stringify(data)}::jsonb, now())
    on conflict (key) do update set data = excluded.data, updated_at = now()
  `;
}

function rowToDailyLog(row: Record<string, unknown>): DailyLog {
  return {
    date: String(row.date).slice(0, 10),
    training_done: Boolean(row.training_done),
    exercises_done: (row.exercises_done ?? {}) as Record<string, boolean>,
    activity_choice: (row.activity_choice as string | null) ?? null,
    meals: (row.meals ?? {}) as DailyLog["meals"],
    supplements: (row.supplements ?? {}) as Record<string, boolean>,
    note: (row.note as string | null) ?? "",
  };
}

export async function getDailyLog(date: string): Promise<DailyLog | null> {
  const { rows } = await sql`select * from daily_logs where date = ${date}`;
  if (rows.length === 0) return null;
  return rowToDailyLog(rows[0]);
}

export async function upsertDailyLog(
  date: string,
  patch: Partial<Omit<DailyLog, "date">>,
): Promise<DailyLog> {
  const existing = (await getDailyLog(date)) ?? {
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
      (date, training_done, exercises_done, activity_choice, meals, supplements, note, updated_at)
    values (
      ${date},
      ${next.training_done},
      ${JSON.stringify(next.exercises_done)}::jsonb,
      ${next.activity_choice},
      ${JSON.stringify(next.meals)}::jsonb,
      ${JSON.stringify(next.supplements)}::jsonb,
      ${next.note},
      now()
    )
    on conflict (date) do update set
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
