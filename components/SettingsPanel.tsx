"use client";

import { useState } from "react";
import { Card } from "./Card";
import { saveContent } from "@/app/actions";
import type { ContentKey } from "@/lib/types";

export function SettingsPanel({
  contentKey,
  title,
  initialData,
}: {
  contentKey: ContentKey;
  title: string;
  initialData: unknown;
}) {
  const [text, setText] = useState(JSON.stringify(initialData, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setError(null);
    setSaved(false);
    const result = await saveContent(contentKey, text);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSaved(true);
  }

  return (
    <Card>
      <p className="mb-2 font-medium">{title}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        className="w-full rounded-lg border border-neutral-200 bg-neutral-50 p-2 font-mono text-xs"
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {saved && <p className="mt-1 text-sm text-emerald-600">Salvo.</p>}
      <button
        onClick={handleSave}
        className="mt-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
      >
        Salvar
      </button>
    </Card>
  );
}
