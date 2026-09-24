import { Card } from "./Card";
import { formatDayMonth, getDayOfWeek } from "@/lib/program";
import type { Contender } from "@/lib/challenge";

const WEEKDAY_SHORT = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

function leaderLine(contenders: Contender[], currentId: string): string {
  const [first, second] = [...contenders].sort((a, b) => b.totals.points - a.totals.points);
  const gap = first.totals.points - second.totals.points;
  if (gap === 0) return "Empate técnico";
  const leaderIsYou = first.user.id === currentId;
  return `${leaderIsYou ? "Você está" : `${first.user.name} está`} na frente por ${gap} ${
    gap === 1 ? "ponto" : "pontos"
  }`;
}

export function Scoreboard({
  contenders,
  dates,
  currentId,
}: {
  contenders: Contender[];
  dates: string[];
  currentId: string;
}) {
  const topPoints = Math.max(...contenders.map((c) => c.totals.points), 1);
  const leaderId = [...contenders].sort((a, b) => b.totals.points - a.totals.points)[0].user.id;
  const tied = contenders.every((c) => c.totals.points === contenders[0].totals.points);

  return (
    <>
      <Card className="p-5">
        <p className="text-xs font-medium text-ink-faint">{leaderLine(contenders, currentId)}</p>

        <div className="mt-4 space-y-4">
          {contenders.map((contender) => {
            const leading = !tied && contender.user.id === leaderId;
            return (
              <div key={contender.user.id}>
                <div className="flex items-baseline justify-between">
                  <p className="font-semibold">
                    {contender.user.name}
                    {contender.user.id === currentId && (
                      <span className="ml-1.5 text-xs font-medium text-ink-faint">você</span>
                    )}
                  </p>
                  <p className="tnum text-2xl font-extrabold leading-none">
                    {contender.totals.points}
                    <span className="ml-1 text-xs font-medium text-ink-faint">pts</span>
                  </p>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-line">
                  <div
                    className={`h-full rounded-full ${leading ? "bg-done" : "bg-ink"}`}
                    style={{ width: `${Math.round((contender.totals.points / topPoints) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-4 border-t border-line pt-3 text-xs text-ink-faint">
          Cada dia vale até 100 pontos: a porcentagem do seu próprio plano que você cumpriu
          (refeições, suplementos e treino). Dietas diferentes valem o mesmo.
        </p>
      </Card>

      <Card className="p-5">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="pb-2 text-left text-xs font-medium text-ink-faint">&nbsp;</th>
              {contenders.map((c) => (
                <th key={c.user.id} className="pb-2 text-right text-xs font-medium text-ink-faint">
                  {c.user.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="tnum">
            <tr className="border-t border-line">
              <td className="py-2 text-ink-dim">Dias 100%</td>
              {contenders.map((c) => (
                <td key={c.user.id} className="py-2 text-right font-semibold">
                  {c.totals.perfectDays}
                </td>
              ))}
            </tr>
            <tr className="border-t border-line">
              <td className="py-2 text-ink-dim">Treinos</td>
              {contenders.map((c) => (
                <td key={c.user.id} className="py-2 text-right font-semibold">
                  {c.totals.trainingsDone}/{c.totals.trainingsRequired}
                </td>
              ))}
            </tr>
            <tr className="border-t border-line">
              <td className="py-2 text-ink-dim">Sequência</td>
              {contenders.map((c) => (
                <td key={c.user.id} className="py-2 text-right font-semibold">
                  {c.totals.streak}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </Card>

      <Card className="p-5">
        <p className="mb-3 font-semibold">Dia a dia</p>
        <div className="space-y-2.5">
          {dates.map((date) => {
            const best = Math.max(...contenders.map((c) => c.scoresByDate[date] ?? 0));
            return (
              <div key={date} className="flex items-center gap-3">
                <span className="tnum w-16 shrink-0 text-xs text-ink-faint">
                  {WEEKDAY_SHORT[getDayOfWeek(date)]} {formatDayMonth(date)}
                </span>
                <div className="flex-1 space-y-1">
                  {contenders.map((c) => {
                    const percent = c.scoresByDate[date] ?? 0;
                    const winning = percent === best && percent > 0;
                    return (
                      <div key={c.user.id} className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                          <div
                            className={`h-full rounded-full ${winning ? "bg-done" : "bg-ink-faint"}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="tnum w-9 shrink-0 text-right text-[11px] text-ink-faint">
                          {percent}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}
