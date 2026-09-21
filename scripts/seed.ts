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

async function main() {
  const program = loadJson<Program>("program.json");
  const weekPattern = loadJson<WeekPatternEntry[]>("week-pattern.json");
  const workoutPlan = loadJson<WorkoutPlan>("workout-plan.json");
  const meals = loadJson<Meal[]>("meals.json");
  const supplements = loadJson<Supplement[]>("supplements.json");

  await setContent("program", program);
  await setContent("weekPattern", weekPattern);
  await setContent("workoutPlan", workoutPlan);
  await setContent("meals", meals);
  await setContent("supplements", supplements);

  console.log("Seeded: program, weekPattern, workoutPlan, meals, supplements");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
