"use client";

import { useState } from "react";
import { Card } from "./Card";
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
  const [errorMealId, setErrorMealId] = useState<string | null>(null);

  async function handleDone(mealId: string, done: boolean) {
    const previous = logs[mealId] ?? { chosenOptionIndex: 0, done: false };
    setErrorMealId(null);
    setLogs((prev) => ({ ...prev, [mealId]: { ...previous, done } }));
    try {
      await toggleMealDone(date, mealId, done);
    } catch {
      setLogs((prev) => ({ ...prev, [mealId]: previous }));
      setErrorMealId(mealId);
    }
  }

  async function handleOption(mealId: string, optionIndex: number) {
    const previous = logs[mealId] ?? { chosenOptionIndex: 0, done: false };
    setErrorMealId(null);
    setLogs((prev) => ({ ...prev, [mealId]: { ...previous, chosenOptionIndex: optionIndex } }));
    try {
      await chooseMealOption(date, mealId, optionIndex);
    } catch {
      setLogs((prev) => ({ ...prev, [mealId]: previous }));
      setErrorMealId(mealId);
    }
  }

  return (
    <Card className="!p-0 overflow-hidden">
      <p className="px-4 pt-4 pb-2 font-display text-lg font-medium text-paper">Refeições</p>
      {meals.map((meal) => {
        const log = logs[meal.id] ?? { chosenOptionIndex: 0, done: false };
        const option = meal.options[log.chosenOptionIndex] ?? meal.options[0];
        return (
          <div key={meal.id} className="border-t border-line px-4 py-3 first:border-t-0">
            <p className="text-sm">
              <span className="font-display text-base text-ember">{meal.time}</span>
              <span className="ml-2 text-paper-dim">{meal.name}</span>
            </p>
            {meal.options.length > 1 && (
              <select
                className="mt-1.5 w-full rounded border border-line-bright bg-ink-field px-2 py-1.5 text-xs text-paper"
                value={log.chosenOptionIndex}
                onChange={(e) => handleOption(meal.id, Number(e.target.value))}
              >
                {meal.options.map((opt, i) => (
                  <option key={opt.title} value={i}>{opt.title}</option>
                ))}
              </select>
            )}
            {option ? (
              <p className="mt-1 text-sm text-paper-dim">{option.items}</p>
            ) : (
              <p className="mt-1 text-sm text-paper-faint">Nenhuma opção configurada para esta refeição.</p>
            )}
            <label className="mt-2 flex min-h-11 cursor-pointer items-center gap-3 active:opacity-70">
              <input
                type="checkbox"
                checked={log.done}
                onChange={(e) => handleDone(meal.id, e.target.checked)}
                className="h-6 w-6 shrink-0 rounded border-2 border-line-bright bg-transparent accent-ember"
              />
              <span className={log.done ? "text-paper-faint line-through" : "text-paper"}>
                Refeição feita
              </span>
            </label>
            {errorMealId === meal.id && (
              <p className="ml-9 text-xs text-red-400">Erro ao salvar — tente novamente.</p>
            )}
          </div>
        );
      })}
    </Card>
  );
}
