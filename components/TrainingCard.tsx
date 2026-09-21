"use client";

import { useState } from "react";
import { Card } from "./Card";
import { Chip } from "./Chip";
import { ProgressBar } from "./ProgressBar";
import { toggleExercise } from "@/app/actions";
import type { ExerciseForWeek } from "@/lib/program";

export function TrainingCard({
  date,
  block,
  focus,
  exercises,
  exercisesDone,
  trainingDone,
  label,
}: {
  date: string;
  block: string;
  focus: string;
  exercises: ExerciseForWeek[];
  exercisesDone: Record<string, boolean>;
  trainingDone: boolean;
  label: string;
}) {
  const [open, setOpen] = useState(false);
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
    <Card onClick={() => setOpen((v) => !v)} className="!p-0 overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-paper-faint">{label}</p>
          <Chip label={trainingDone ? "Concluído" : "Pendente"} tone={trainingDone ? "success" : "neutral"} />
        </div>
        <p className="mt-1 font-display text-4xl font-semibold leading-none tracking-tight text-paper">
          Treino {block}
        </p>
        <p className="mt-1 text-sm text-paper-dim">{focus}</p>
        <div className="mt-4">
          <ProgressBar value={doneCount} max={exercises.length} />
          <p className="mt-1.5 text-xs text-paper-faint">
            {doneCount}/{exercises.length} exercícios{open ? "" : " · toque para abrir"}
          </p>
        </div>
      </div>
      {open && (
        <div className="border-t border-line" onClick={(e) => e.stopPropagation()}>
          {exercises.map((exercise, index) => {
            const checked = doneMap[String(index)] === true;
            return (
              <div key={exercise.name} className="border-t border-line px-4 py-3 first:border-t-0">
                <label className="flex min-h-11 cursor-pointer items-start gap-3 active:opacity-70">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => handleToggle(index, e.target.checked)}
                    className="mt-0.5 h-6 w-6 shrink-0 rounded border-2 border-line-bright bg-transparent accent-ember"
                  />
                  <span className="flex-1">
                    <span className={checked ? "text-paper-faint line-through" : "text-paper"}>
                      {exercise.name}
                    </span>
                    <span className="block text-xs text-paper-dim">
                      {exercise.sets}x {exercise.reps}
                      {exercise.tempo ? (
                        <span className="ml-2 font-display tracking-wide text-ember">{exercise.tempo}</span>
                      ) : null}
                    </span>
                  </span>
                </label>
                {errorIndex === index && (
                  <p className="ml-9 text-xs text-red-400">Erro ao salvar — tente novamente.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
