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

  const doneCount = supplements.filter((s) => logs[s.id] === true).length;

  return (
    <Card>
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <p className="font-semibold">Suplementos</p>
        <p className="tnum text-sm text-ink-dim">
          {doneCount}/{supplements.length}
        </p>
      </div>
      {supplements.map((supplement) => {
        const checked = logs[supplement.id] === true;
        return (
          <div key={supplement.id} className="border-t border-line px-5">
            <label className="flex min-h-14 cursor-pointer items-center gap-3 active:opacity-60">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => handleToggle(supplement.id, e.target.checked)}
                className="h-6 w-6 shrink-0 rounded-md border-2 border-line-strong accent-done"
              />
              <span className="flex-1">
                <span
                  className={`block text-[15px] leading-tight ${
                    checked ? "text-ink-faint line-through" : "text-ink"
                  }`}
                >
                  {supplement.name}
                </span>
                <span className="mt-0.5 block text-[13px] text-ink-dim">{supplement.dose}</span>
              </span>
            </label>
            {errorId === supplement.id && (
              <p className="pb-2 pl-9 text-xs text-red-600">Erro ao salvar — tente de novo.</p>
            )}
          </div>
        );
      })}
    </Card>
  );
}
