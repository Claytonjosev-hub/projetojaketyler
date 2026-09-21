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
  const [open, setOpen] = useState(false);
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
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-14 w-full items-center justify-between px-5 text-left active:opacity-60"
      >
        <span className="font-medium">{title}</span>
        <span className={`text-ink-faint transition-transform ${open ? "rotate-180" : ""}`}>⌄</span>
      </button>

      {open && (
        <div className="border-t border-line p-5">
          <textarea
            value={text}
            onChange={(e) => handleChange(e.target.value)}
            rows={12}
            spellCheck={false}
            className="w-full rounded-xl border border-line-strong bg-canvas p-3 font-mono text-xs leading-relaxed text-ink-dim focus:border-ink focus:outline-none"
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          {saved && <p className="mt-2 text-sm text-done">Salvo.</p>}
          <button
            onClick={handleSave}
            className="mt-3 min-h-11 w-full rounded-xl bg-ink px-4 text-sm font-semibold text-surface active:opacity-80"
          >
            Salvar
          </button>
        </div>
      )}
    </Card>
  );
}
