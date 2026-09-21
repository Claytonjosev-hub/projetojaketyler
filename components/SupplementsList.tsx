"use client";

import { useState } from "react";
import { Card } from "./Card";
import { Checkbox } from "./Checkbox";
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
    <Card>
      <p className="mb-2 font-medium">Suplementos</p>
      {supplements.map((supplement) => (
        <div key={supplement.id}>
          <Checkbox
            checked={logs[supplement.id] === true}
            onChange={(checked) => handleToggle(supplement.id, checked)}
            label={`${supplement.name} — ${supplement.dose}`}
          />
          {errorId === supplement.id && (
            <p className="text-xs text-red-600">Erro ao salvar — tente novamente.</p>
          )}
        </div>
      ))}
    </Card>
  );
}
