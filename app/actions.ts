"use server";

import { revalidatePath } from "next/cache";
import { getContent, getDailyLog, setContent, upsertDailyLog } from "@/lib/db";
import { getDayPattern } from "@/lib/program";
import type { ContentKey, ContentShape } from "@/lib/types";

async function recomputeTrainingDone(date: string, exercisesDone: Record<string, boolean>) {
  const [weekPattern, workoutPlan, dailyLog] = await Promise.all([
    getContent("weekPattern"),
    getContent("workoutPlan"),
    getDailyLog(date),
  ]);
  const pattern = getDayPattern(date, weekPattern, dailyLog);
  if (!pattern.trainingBlock) return false;
  const block = workoutPlan[pattern.trainingBlock];
  return block.exercises.every((_, index) => exercisesDone[String(index)] === true);
}

export async function toggleExercise(date: string, exerciseIndex: number, done: boolean) {
  const existing = await getDailyLog(date);
  const exercisesDone = { ...(existing?.exercises_done ?? {}), [String(exerciseIndex)]: done };
  const trainingDone = await recomputeTrainingDone(date, exercisesDone);
  await upsertDailyLog(date, { exercises_done: exercisesDone, training_done: trainingDone });
  revalidatePath("/");
  revalidatePath("/progress");
}

export async function toggleMealDone(date: string, mealId: string, done: boolean) {
  const existing = await getDailyLog(date);
  const current = existing?.meals[mealId] ?? { chosenOptionIndex: 0, done: false };
  const meals = { ...(existing?.meals ?? {}), [mealId]: { ...current, done } };
  await upsertDailyLog(date, { meals });
  revalidatePath("/");
  revalidatePath("/progress");
}

export async function chooseMealOption(date: string, mealId: string, optionIndex: number) {
  const existing = await getDailyLog(date);
  const current = existing?.meals[mealId] ?? { chosenOptionIndex: 0, done: false };
  const meals = { ...(existing?.meals ?? {}), [mealId]: { ...current, chosenOptionIndex: optionIndex } };
  await upsertDailyLog(date, { meals });
  revalidatePath("/");
}

export async function toggleSupplement(date: string, supplementId: string, done: boolean) {
  const existing = await getDailyLog(date);
  const supplements = { ...(existing?.supplements ?? {}), [supplementId]: done };
  await upsertDailyLog(date, { supplements });
  revalidatePath("/");
  revalidatePath("/progress");
}

export async function setActivityChoice(date: string, activity: string | null) {
  await upsertDailyLog(date, { activity_choice: activity });
  revalidatePath("/");
  revalidatePath("/progress");
}

export async function saveContent(
  key: ContentKey,
  jsonText: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { ok: false, error: "JSON inválido — verifique a sintaxe." };
  }
  await setContent(key, parsed as ContentShape[typeof key]);
  revalidatePath("/");
  revalidatePath("/progress");
  revalidatePath("/settings");
  return { ok: true };
}
