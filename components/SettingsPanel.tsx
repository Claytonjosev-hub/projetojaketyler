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

  function handleChange(value: string) {
    setText(value);
    setSaved(false);
  }

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
      <p className="mb-2 font-display text-lg font-medium text-paper">{title}</p>
      <textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        rows={10}
        spellCheck={false}
        className="w-full rounded-md border border-line-bright bg-ink-field p-2 font-mono text-xs text-paper-dim focus:border-ember focus:outline-none"
      />
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
      {saved && <p className="mt-1 text-sm text-moss">Salvo.</p>}
      <button
        onClick={handleSave}
        className="mt-2 min-h-11 rounded-md bg-ember px-4 text-sm font-medium text-ink active:opacity-80"
      >
        Salvar
      </button>
    </Card>
  );
}
