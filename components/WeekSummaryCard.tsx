"use client";

import { useState } from "react";
import { Card } from "./Card";
import { formatDayMonth, getDayOfWeek, type WeekSummary } from "@/lib/program";

const WEEKDAY_SHORT = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

export function WeekSummaryCard({
  summary,
  text,
  defaultOpen,
}: {
  summary: WeekSummary;
  text: string;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-14 w-full items-center justify-between px-5 text-left active:opacity-60"
      >
        <span>
          <span className="font-medium">Semana {summary.weekNumber}</span>
          <span className="ml-2 text-sm text-ink-faint">
            {formatDayMonth(summary.firstDate)} a {formatDayMonth(summary.lastDate)}
          </span>
        </span>
        <span className={`text-ink-faint transition-transform ${open ? "rotate-180" : ""}`}>⌄</span>
      </button>

      {open && (
        <div className="border-t border-line px-5 py-4">
          <dl className="tnum grid grid-cols-3 gap-2 text-center">
            <div>
              <dt className="text-xs text-ink-faint">Dias</dt>
              <dd className="mt-0.5 font-semibold">
                {summary.daysComplete}/{summary.daysElapsed}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-faint">Treinos</dt>
              <dd className="mt-0.5 font-semibold">
                {summary.trainingsDone}/{summary.trainingsRequired}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-faint">Refeições</dt>
              <dd className="mt-0.5 font-semibold">
                {summary.mealsDone}/{summary.mealsTotal}
              </dd>
            </div>
          </dl>

          {summary.notes.length > 0 ? (
            <ul className="mt-4 space-y-3 border-t border-line pt-4">
              {summary.notes.map((entry) => (
                <li key={entry.date}>
                  <p className="text-xs font-medium text-ink-faint">
                    {WEEKDAY_SHORT[getDayOfWeek(entry.date)]} {formatDayMonth(entry.date)}
                  </p>
                  <p className="mt-0.5 text-sm whitespace-pre-line text-ink-dim">{entry.note}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 border-t border-line pt-4 text-sm text-ink-faint">
              Nenhuma anotação nesta semana.
            </p>
          )}

          <button
            onClick={handleCopy}
            className="mt-4 min-h-11 w-full rounded-xl bg-ink px-4 text-sm font-semibold text-surface active:opacity-80"
          >
            {copied ? "Copiado" : "Copiar resumo"}
          </button>
        </div>
      )}
    </Card>
  );
}
