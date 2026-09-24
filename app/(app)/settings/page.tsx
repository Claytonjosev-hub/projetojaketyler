import { SettingsPanel } from "@/components/SettingsPanel";
import { UserPill } from "@/components/UserPill";
import { getContent } from "@/lib/db";
import { getSession } from "@/lib/session";
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
  const { users, current } = await getSession();
  const userId = current!.id;
  const data = await Promise.all(PANELS.map((panel) => getContent(userId, panel.key)));

  return (
    <main className="mx-auto max-w-lg space-y-3 p-4 pt-8">
      <div className="flex items-start justify-between gap-3 px-1">
        <h1 className="text-[32px] font-extrabold leading-none tracking-tight">Config</h1>
        <UserPill users={users} currentId={userId} />
      </div>
      <p className="px-1 pb-2 text-sm text-ink-dim">
        Editando o plano de <strong className="font-semibold text-ink">{current!.name}</strong>. Cole
        um JSON novo em qualquer painel e salve.
      </p>
      {PANELS.map((panel, i) => (
        <SettingsPanel key={panel.key} contentKey={panel.key} title={panel.title} initialData={data[i]} />
      ))}
    </main>
  );
}
