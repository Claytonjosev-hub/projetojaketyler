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

  async function handleToggle(id: string, checked: boolean) {
    setLogs((prev) => ({ ...prev, [id]: checked }));
    await toggleSupplement(date, id, checked);
  }

  return (
    <Card>
      <p className="mb-2 font-medium">Suplementos</p>
      {supplements.map((supplement) => (
        <Checkbox
          key={supplement.id}
          checked={logs[supplement.id] === true}
          onChange={(checked) => handleToggle(supplement.id, checked)}
          label={`${supplement.name} — ${supplement.dose}`}
        />
      ))}
    </Card>
  );
}
