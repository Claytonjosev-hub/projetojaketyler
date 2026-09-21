"use client";

import { useState } from "react";
import { Card } from "./Card";
import { Checkbox } from "./Checkbox";
import { chooseMealOption, toggleMealDone } from "@/app/actions";
import type { Meal, MealLogEntry } from "@/lib/types";

export function MealsList({
  date,
  meals,
  mealLogs,
}: {
  date: string;
  meals: Meal[];
  mealLogs: Record<string, MealLogEntry>;
}) {
  const [logs, setLogs] = useState(mealLogs);

  async function handleDone(mealId: string, done: boolean) {
    setLogs((prev) => ({ ...prev, [mealId]: { ...(prev[mealId] ?? { chosenOptionIndex: 0, done: false }), done } }));
    await toggleMealDone(date, mealId, done);
  }

  async function handleOption(mealId: string, optionIndex: number) {
    setLogs((prev) => ({ ...prev, [mealId]: { ...(prev[mealId] ?? { chosenOptionIndex: 0, done: false }), chosenOptionIndex: optionIndex } }));
    await chooseMealOption(date, mealId, optionIndex);
  }

  return (
    <Card>
      <p className="mb-2 font-medium">Refeições</p>
      {meals.map((meal) => {
        const log = logs[meal.id] ?? { chosenOptionIndex: 0, done: false };
        const option = meal.options[log.chosenOptionIndex] ?? meal.options[0];
        return (
          <div key={meal.id} className="border-t border-neutral-100 py-2 first:border-t-0">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-500">{meal.time} — {meal.name}</p>
              {meal.options.length > 1 && (
                <select
                  className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs"
                  value={log.chosenOptionIndex}
                  onChange={(e) => handleOption(meal.id, Number(e.target.value))}
                >
                  {meal.options.map((opt, i) => (
                    <option key={opt.title} value={i}>{opt.title}</option>
                  ))}
                </select>
              )}
            </div>
            <p className="mb-1 text-sm text-neutral-600">{option.items}</p>
            <Checkbox checked={log.done} onChange={(checked) => handleDone(meal.id, checked)} label="Refeição feita" />
          </div>
        );
      })}
    </Card>
  );
}
