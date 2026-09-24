"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getContent, getDailyLog, listUsers, setContent, upsertDailyLog } from "@/lib/db";
import { getDayPattern, isRestActivity } from "@/lib/program";
import { USER_COOKIE, USER_COOKIE_MAX_AGE, requireUserId } from "@/lib/session";
import type { ContentKey, ContentShape } from "@/lib/types";

const CONTENT_KEYS: ContentKey[] = ["program", "weekPattern", "workoutPlan", "meals", "supplements"];

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/progress");
  revalidatePath("/challenge");
  revalidatePath("/settings");
}

export async function switchUser(userId: string) {
  const users = await listUsers();
  if (!users.some((user) => user.id === userId)) {
    throw new Error(`perfil desconhecido: ${userId}`);
  }
  const store = await cookies();
  store.set(USER_COOKIE, userId, {
    path: "/",
    maxAge: USER_COOKIE_MAX_AGE,
    sameSite: "lax",
  });
  revalidateAll();
}

async function recomputeTrainingDone(
  userId: string,
  date: string,
  exercisesDone: Record<string, boolean>,
) {
  const [weekPattern, workoutPlan, dailyLog] = await Promise.all([
    getContent(userId, "weekPattern"),
    getContent(userId, "workoutPlan"),
    getDailyLog(userId, date),
  ]);
  const pattern = getDayPattern(date, weekPattern, dailyLog);
  if (!pattern.trainingBlock) return false;
  const block = workoutPlan.blocks[pattern.trainingBlock];
  if (!block) {
    throw new Error(`workoutPlan has no entry for block "${pattern.trainingBlock}"`);
  }
  return block.exercises.every((_, index) => exercisesDone[String(index)] === true);
}

export async function toggleExercise(date: string, exerciseIndex: number, done: boolean) {
  const userId = await requireUserId();
  const existing = await getDailyLog(userId, date);
  const exercisesDone = { ...(existing?.exercises_done ?? {}), [String(exerciseIndex)]: done };
  const trainingDone = await recomputeTrainingDone(userId, date, exercisesDone);
  await upsertDailyLog(userId, date, { exercises_done: exercisesDone, training_done: trainingDone });
  revalidateAll();
}

export async function toggleMealDone(date: string, mealId: string, done: boolean) {
  const userId = await requireUserId();
  const existing = await getDailyLog(userId, date);
  const current = existing?.meals[mealId] ?? { chosenOptionIndex: 0, done: false };
  const meals = { ...(existing?.meals ?? {}), [mealId]: { ...current, done } };
  await upsertDailyLog(userId, date, { meals });
  revalidateAll();
}

export async function chooseMealOption(date: string, mealId: string, optionIndex: number) {
  const userId = await requireUserId();
  const existing = await getDailyLog(userId, date);
  const current = existing?.meals[mealId] ?? { chosenOptionIndex: 0, done: false };
  const meals = { ...(existing?.meals ?? {}), [mealId]: { ...current, chosenOptionIndex: optionIndex } };
  await upsertDailyLog(userId, date, { meals });
  revalidatePath("/");
}

export async function toggleSupplement(date: string, supplementId: string, done: boolean) {
  const userId = await requireUserId();
  const existing = await getDailyLog(userId, date);
  const supplements = { ...(existing?.supplements ?? {}), [supplementId]: done };
  await upsertDailyLog(userId, date, { supplements });
  revalidateAll();
}

export async function saveDayNote(date: string, note: string) {
  const userId = await requireUserId();
  await upsertDailyLog(userId, date, { note: note.trim() });
  revalidateAll();
}

export async function setActivityChoice(date: string, activity: string | null) {
  const userId = await requireUserId();
  const patch: Partial<{ activity_choice: string | null; training_done: boolean }> = {
    activity_choice: activity,
  };
  if (isRestActivity(activity)) {
    patch.training_done = false;
  }
  await upsertDailyLog(userId, date, patch);
  revalidateAll();
}

export async function toggleActivityDone(date: string, done: boolean) {
  const userId = await requireUserId();
  await upsertDailyLog(userId, date, { training_done: done });
  revalidateAll();
}

export async function saveContent(
  key: ContentKey,
  jsonText: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!CONTENT_KEYS.includes(key)) {
    return { ok: false, error: "Chave de conteúdo inválida." };
  }
  let parsed: unknown;
  try {
    const userId = await requireUserId();
    parsed = JSON.parse(jsonText);
    await setContent(userId, key, parsed as ContentShape[typeof key]);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { ok: false, error: "JSON inválido — verifique a sintaxe." };
    }
    return { ok: false, error: "Erro ao salvar — tente novamente." };
  }
  revalidateAll();
  return { ok: true };
}
