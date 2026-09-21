import { SettingsPanel } from "@/components/SettingsPanel";
import { getContent } from "@/lib/db";
import type { ContentKey } from "@/lib/types";

export const dynamic = "force-dynamic";

const PANELS: { key: ContentKey; title: string }[] = [
  { key: "program", title: "Programa" },
  { key: "weekPattern", title: "Padrão da Semana" },
  { key: "workoutPlan", title: "Plano de Treino" },
  { key: "meals", title: "Refeições" },
  { key: "supplements", title: "Suplementos" },
];

export default async function SettingsPage() {
  const data = await Promise.all(PANELS.map((panel) => getContent(panel.key)));

  return (
    <main className="mx-auto max-w-lg space-y-3 p-4 pt-8">
      <h1 className="px-1 text-[32px] font-extrabold leading-none tracking-tight">Config</h1>
      <p className="px-1 pb-2 text-sm text-ink-dim">
        Cole um JSON novo em qualquer painel e salve — sem precisar mexer em código.
      </p>
      {PANELS.map((panel, i) => (
        <SettingsPanel key={panel.key} contentKey={panel.key} title={panel.title} initialData={data[i]} />
      ))}
    </main>
  );
}
