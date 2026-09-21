"use client";

import { useState } from "react";
import { Card } from "./Card";
import { toggleSupplement } from "@/app/actions";
import type { Supplement } from "@/lib/types";

export function SupplementsList({
  date,
  supplements,
  supplementLogs,
}: {
  date: string;
  supplements: Supplement[];
  supplementLogs: Record<string, boolean>;
}) {
  const [logs, setLogs] = useState(supplementLogs);
  const [errorId, setErrorId] = useState<string | null>(null);

  async function handleToggle(id: string, checked: boolean) {
    const previous = logs[id] === true;
    setErrorId(null);
    setLogs((prev) => ({ ...prev, [id]: checked }));
    try {
      await toggleSupplement(date, id, checked);
    } catch {
      setLogs((prev) => ({ ...prev, [id]: previous }));
      setErrorId(id);
    }
  }

  return (
    <Card className="!p-0 overflow-hidden">
      <p className="px-4 pt-4 pb-2 font-display text-lg font-medium text-paper">Suplementos</p>
      {supplements.map((supplement) => {
        const checked = logs[supplement.id] === true;
        return (
          <div key={supplement.id} className="border-t border-line px-4 py-3 first:border-t-0">
            <label className="flex min-h-11 cursor-pointer items-start gap-3 active:opacity-70">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => handleToggle(supplement.id, e.target.checked)}
                className="mt-0.5 h-6 w-6 shrink-0 rounded border-2 border-line-bright bg-transparent accent-ember"
              />
              <span className="flex-1">
                <span className={checked ? "text-paper-faint line-through" : "text-paper"}>
                  {supplement.name}
                </span>
                <span className="block text-xs text-paper-dim">{supplement.dose}</span>
              </span>
            </label>
            {errorId === supplement.id && (
              <p className="ml-9 text-xs text-red-400">Erro ao salvar — tente novamente.</p>
            )}
          </div>
        );
      })}
    </Card>
  );
}
