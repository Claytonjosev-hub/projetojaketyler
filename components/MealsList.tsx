"use client";

import { useState } from "react";
import { Card } from "./Card";
import { chooseMealOption, toggleMealDone } from "@/app/actions";
import type { Meal, MealLogEntry } from "@/lib/types";

export function MealsList({
  date,
  meals,
  mealLogs,
  focus,
}: {
  date: string;
  meals: Meal[];
  mealLogs: Record<string, MealLogEntry>;
  focus: { mealId: string; due: boolean } | null;
}) {
  const [logs, setLogs] = useState(mealLogs);
  const [openId, setOpenId] = useState<string | null>(null);
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

  const doneCount = meals.filter((meal) => logs[meal.id]?.done).length;

  return (
    <Card>
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <p className="font-semibold">Refeições</p>
        <p className="tnum text-sm text-ink-dim">
          {doneCount}/{meals.length}
        </p>
      </div>
      {meals.map((meal) => {
        const log = logs[meal.id] ?? { chosenOptionIndex: 0, done: false };
        const option = meal.options[log.chosenOptionIndex] ?? meal.options[0];
        const isOpen = openId === meal.id;
        return (
          <div key={meal.id} className="border-t border-line">
            <div className="flex items-stretch">
              <label className="flex min-h-14 cursor-pointer items-center pl-5 pr-3 active:opacity-60">
                <input
                  type="checkbox"
                  checked={log.done}
                  onChange={(e) => handleDone(meal.id, e.target.checked)}
                  className="h-6 w-6 shrink-0 rounded-md border-2 border-line-strong accent-done"
                />
              </label>
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : meal.id)}
                className="flex min-h-14 flex-1 items-center justify-between gap-3 pr-5 text-left active:opacity-60"
              >
                <span>
                  <span className="tnum text-sm text-ink-faint">{meal.time}</span>
                  <span
                    className={`ml-2 text-[15px] ${log.done ? "text-ink-faint line-through" : "text-ink"}`}
                  >
                    {meal.name}
                  </span>
                  {focus?.mealId === meal.id && !log.done && (
                    <span className="ml-2 rounded-full bg-ink px-2 py-0.5 text-[11px] font-medium text-surface">
                      {focus.due ? "agora" : "próxima"}
                    </span>
                  )}
                </span>
                <span className={`text-ink-faint transition-transform ${isOpen ? "rotate-180" : ""}`}>
                  ⌄
                </span>
              </button>
            </div>

            {isOpen && (
              <div className="px-5 pb-4">
                {meal.options.length > 1 && (
                  <select
                    className="mb-2 w-full rounded-xl border border-line-strong bg-surface px-3 py-2.5 text-sm"
                    value={log.chosenOptionIndex}
                    onChange={(e) => handleOption(meal.id, Number(e.target.value))}
                  >
                    {meal.options.map((opt, i) => (
                      <option key={opt.title} value={i}>
                        {opt.title}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-sm leading-relaxed text-ink-dim">
                  {option ? option.items : "Nenhuma opção configurada."}
                </p>
              </div>
            )}

            {errorMealId === meal.id && (
              <p className="px-5 pb-2 text-xs text-red-600">Erro ao salvar — tente de novo.</p>
            )}
          </div>
        );
      })}
    </Card>
  );
}
