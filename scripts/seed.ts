import { readFileSync } from "node:fs";
import { join } from "node:path";
import { setContent } from "../lib/db";
import type {
  Meal,
  Program,
  Supplement,
  WeekPatternEntry,
  WorkoutPlan,
} from "../lib/types";

function loadJson<T>(filename: string): T {
  const path = join(process.cwd(), "db", "seed-data", filename);
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

const userId = process.argv[2];
if (!userId) {
  console.error("uso: npm run seed -- <userId>");
  process.exit(1);
}

async function main() {
  const program = loadJson<Program>("program.json");
  const weekPattern = loadJson<WeekPatternEntry[]>("week-pattern.json");
  const workoutPlan = loadJson<WorkoutPlan>("workout-plan.json");
  const meals = loadJson<Meal[]>("meals.json");
  const supplements = loadJson<Supplement[]>("supplements.json");

  await setContent(userId, "program", program);
  await setContent(userId, "weekPattern", weekPattern);
  await setContent(userId, "workoutPlan", workoutPlan);
  await setContent(userId, "meals", meals);
  await setContent(userId, "supplements", supplements);

  console.log(`Seeded ${userId}: program, weekPattern, workoutPlan, meals, supplements`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
