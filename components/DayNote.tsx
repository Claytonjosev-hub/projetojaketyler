"use client";

import { useState } from "react";
import { Card } from "./Card";
import { saveDayNote } from "@/app/actions";

export function DayNote({ date, note }: { date: string; note: string }) {
  const [saved, setSaved] = useState(note);
  const [draft, setDraft] = useState(note);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  async function handleSave() {
    setError(false);
    setSaving(true);
    try {
      await saveDayNote(date, draft);
      setSaved(draft.trim());
      setEditing(false);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <Card>
        <button
          type="button"
          onClick={() => {
            setDraft(saved);
            setEditing(true);
          }}
          className="w-full px-5 py-4 text-left active:opacity-60"
        >
          <span className="text-xs font-medium text-ink-faint">Como foi o dia</span>
          {saved ? (
            <span className="mt-1.5 block text-sm whitespace-pre-line text-ink">{saved}</span>
          ) : (
            <span className="mt-1.5 block text-sm text-ink-dim">
              Anotar o que fugiu do plano — refeição pulada, troca, treino difícil…
            </span>
          )}
        </button>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <p className="text-xs font-medium text-ink-faint">Como foi o dia</p>
      <textarea
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={5}
        placeholder="Ex: pulei o lanche das 16h, comi tapioca no lugar do pão, treino de pull rendeu bem"
        className="mt-2 w-full rounded-xl border border-line-strong bg-canvas p-3 text-sm leading-relaxed placeholder:text-ink-faint focus:border-ink focus:outline-none"
      />
      {error && <p className="mt-2 text-sm text-red-600">Erro ao salvar — tente de novo.</p>}
      <div className="mt-3 flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="min-h-11 flex-1 rounded-xl bg-ink px-4 text-sm font-semibold text-surface active:opacity-80 disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar"}
        </button>
        <button
          onClick={() => {
            setDraft(saved);
            setEditing(false);
            setError(false);
          }}
          className="min-h-11 rounded-xl border border-line-strong px-4 text-sm font-medium text-ink-dim active:bg-canvas"
        >
          Cancelar
        </button>
      </div>
    </Card>
  );
}
