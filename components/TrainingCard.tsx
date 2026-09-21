"use client";

import { useState } from "react";
import { Card } from "./Card";
import { Checkbox } from "./Checkbox";
import { Chip } from "./Chip";
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

  async function handleToggle(index: number, checked: boolean) {
    setDoneMap((prev) => ({ ...prev, [String(index)]: checked }));
    await toggleExercise(date, index, checked);
  }

  return (
    <Card onClick={() => setOpen((v) => !v)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500">{label}</p>
          <p className="font-medium">Treino {block} — {focus}</p>
        </div>
        <Chip label={trainingDone ? "Concluído" : "Pendente"} tone={trainingDone ? "success" : "neutral"} />
      </div>
      {open && (
        <div className="mt-3 border-t border-neutral-100 pt-3" onClick={(e) => e.stopPropagation()}>
          {exercises.map((exercise, index) => (
            <Checkbox
              key={exercise.name}
              checked={doneMap[String(index)] === true}
              onChange={(checked) => handleToggle(index, checked)}
              label={`${exercise.name} — ${exercise.sets}x ${exercise.reps}${exercise.tempo ? ` (tempo ${exercise.tempo})` : ""}`}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
