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
    <main className="space-y-4 p-4">
      <h1 className="text-xl font-semibold">Config</h1>
      <p className="text-sm text-neutral-500">
        Cole um JSON novo em qualquer painel e salve — sem precisar mexer em código.
      </p>
      {PANELS.map((panel, i) => (
        <SettingsPanel key={panel.key} contentKey={panel.key} title={panel.title} initialData={data[i]} />
      ))}
    </main>
  );
}
