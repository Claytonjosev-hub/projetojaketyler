"use client";

import { useState } from "react";
import { Card } from "./Card";
import { Chip } from "./Chip";
import { ProgressBar } from "./ProgressBar";
import { toggleExercise } from "@/app/actions";
import type { Exercise } from "@/lib/types";

export function TrainingCard({
  date,
  isToday,
  label,
  focus,
  cardio,
  exercises,
  exercisesDone,
  trainingDone,
  guidelines,
}: {
  date: string;
  isToday: boolean;
  label: string;
  focus: string;
  cardio: string | null;
  exercises: Exercise[];
  exercisesDone: Record<string, boolean>;
  trainingDone: boolean;
  guidelines: string[];
}) {
  const [open, setOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [doneMap, setDoneMap] = useState(exercisesDone);
  const [errorIndex, setErrorIndex] = useState<number | null>(null);

  async function handleToggle(index: number, checked: boolean) {
    const previous = doneMap[String(index)] === true;
    setErrorIndex(null);
    setDoneMap((prev) => ({ ...prev, [String(index)]: checked }));
    try {
      await toggleExercise(date, index, checked);
    } catch {
      setDoneMap((prev) => ({ ...prev, [String(index)]: previous }));
      setErrorIndex(index);
    }
  }

  const doneCount = exercises.filter((_, i) => doneMap[String(i)] === true).length;

  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full p-5 text-left active:opacity-60"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-ink-faint">
              {isToday ? "Treino de hoje" : "Treino do dia"}
            </p>
            <p className="mt-1 text-3xl font-extrabold leading-none tracking-tight">{label}</p>
            <p className="mt-1.5 text-sm text-ink-dim">
              {focus}
              {cardio ? ` · ${cardio}` : ""}
            </p>
          </div>
          <Chip
            label={trainingDone ? "Feito" : `${doneCount}/${exercises.length}`}
            tone={trainingDone ? "success" : "neutral"}
          />
        </div>
        <div className="mt-4">
          <ProgressBar value={doneCount} max={exercises.length} />
        </div>
      </button>

      {open && (
        <div className="border-t border-line">
          {exercises.map((exercise, index) => {
            const checked = doneMap[String(index)] === true;
            return (
              <div key={`${exercise.name}-${index}`} className="border-b border-line px-5 py-1">
                <label className="flex min-h-14 cursor-pointer items-center gap-3 active:opacity-60">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => handleToggle(index, e.target.checked)}
                    className="h-6 w-6 shrink-0 rounded-md border-2 border-line-strong accent-done"
                  />
                  <span className="flex-1">
                    <span
                      className={`block text-[15px] leading-tight ${
                        checked ? "text-ink-faint line-through" : "text-ink"
                      }`}
                    >
                      {exercise.name}
                    </span>
                    <span className="tnum mt-0.5 block text-[13px] text-ink-dim">
                      {exercise.scheme}
                      {exercise.note ? ` — ${exercise.note}` : ""}
                    </span>
                  </span>
                </label>
                {errorIndex === index && (
                  <p className="pb-2 pl-9 text-xs text-red-600">Erro ao salvar — tente de novo.</p>
                )}
              </div>
            );
          })}

          {guidelines.length > 0 && (
            <div className="px-5 py-3">
              <button
                type="button"
                onClick={() => setRulesOpen((v) => !v)}
                className="min-h-11 text-sm text-ink-dim underline underline-offset-4 active:opacity-60"
              >
                {rulesOpen ? "Ocultar regras do treino" : "Regras do treino"}
              </button>
              {rulesOpen && (
                <ul className="mt-1 space-y-1.5 pb-2">
                  {guidelines.map((rule) => (
                    <li key={rule} className="text-[13px] leading-snug text-ink-dim">
                      {rule}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
