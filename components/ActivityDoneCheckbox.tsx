"use client";

import { useState } from "react";
import { Checkbox } from "./Checkbox";
import { toggleActivityDone } from "@/app/actions";

export function ActivityDoneCheckbox({
  date,
  trainingDone,
}: {
  date: string;
  trainingDone: boolean;
}) {
  const [done, setDone] = useState(trainingDone);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle(checked: boolean) {
    const previous = done;
    setError(null);
    setDone(checked);
    try {
      await toggleActivityDone(date, checked);
    } catch {
      setDone(previous);
      setError("Erro ao salvar — tente novamente.");
    }
  }

  return (
    <div>
      <Checkbox checked={done} onChange={handleToggle} label="Atividade concluída" />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
