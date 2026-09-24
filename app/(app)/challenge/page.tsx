import { Card } from "@/components/Card";
import { UserPill } from "@/components/UserPill";
import { Scoreboard } from "@/components/Scoreboard";
import { scoreDay, tallyDays, type Contender, type DayScore } from "@/lib/challenge";
import { getContent, getDailyLogRange, listUsers } from "@/lib/db";
import { formatDayMonth, getDayPattern, todayIso } from "@/lib/program";
import { getSession } from "@/lib/session";
import type { User } from "@/lib/types";

export const dynamic = "force-dynamic";

function isoDateNDaysFrom(base: string, offset: number): string {
  const d = new Date(`${base}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): string[] {
  const dates: string[] = [];
  let cursor = from;
  while (cursor <= to) {
    dates.push(cursor);
    cursor = isoDateNDaysFrom(cursor, 1);
  }
  return dates;
}

async function loadContender(user: User, dates: string[]): Promise<Contender> {
  const [weekPattern, meals, supplements] = await Promise.all([
    getContent(user.id, "weekPattern"),
    getContent(user.id, "meals"),
    getContent(user.id, "supplements"),
  ]);
  const logs = await getDailyLogRange(user.id, dates[0], dates[dates.length - 1]);

  const scores: DayScore[] = [];
  const scoresByDate: Record<string, number> = {};

  for (const date of dates) {
    const dailyLog = logs.get(date) ?? null;
    const pattern = getDayPattern(date, weekPattern, dailyLog);
    const score = scoreDay({ dailyLog, pattern, meals, supplements });
    scores.push(score);
    scoresByDate[date] = score.percent;
  }

  return { user, totals: tallyDays(scores), scoresByDate };
}

export default async function ChallengePage() {
  const today = todayIso();
  const { users, current } = await getSession();
  const userId = current!.id;

  const allUsers = users.length > 0 ? users : await listUsers();

  if (allUsers.length < 2) {
    return (
      <main className="mx-auto max-w-lg space-y-3 p-4 pt-8">
        <h1 className="px-1 text-[32px] font-extrabold leading-none tracking-tight">Desafio</h1>
        <Card className="p-5">
          <p className="text-sm text-ink-dim">
            O desafio precisa de pelo menos duas pessoas no app.
          </p>
        </Card>
      </main>
    );
  }

  // The challenge only counts days both had a plan for, so whoever joined later
  // is never punished for the days before they started.
  const programs = await Promise.all(
    allUsers.map(async (user) => ({ user, program: await getContent(user.id, "program") })),
  );
  const start = programs.map((p) => p.program.startDate).sort().at(-1)!;

  if (start > today) {
    return (
      <main className="mx-auto max-w-lg space-y-3 p-4 pt-8">
        <h1 className="px-1 text-[32px] font-extrabold leading-none tracking-tight">Desafio</h1>
        <Card className="p-5">
          <p className="text-sm text-ink-dim">
            O desafio começa em {formatDayMonth(start)}.
          </p>
        </Card>
      </main>
    );
  }

  const dates = daysBetween(start, today);
  const contenders = await Promise.all(allUsers.map((user) => loadContender(user, dates)));

  return (
    <main className="mx-auto max-w-lg space-y-3 p-4 pt-8">
      <div className="flex items-start justify-between gap-3 px-1">
        <h1 className="text-[32px] font-extrabold leading-none tracking-tight">Desafio</h1>
        <UserPill users={users} currentId={userId} />
      </div>
      <p className="px-1 pb-2 text-sm text-ink-dim">
        {formatDayMonth(start)} até hoje · {dates.length} {dates.length === 1 ? "dia" : "dias"}
      </p>

      <Scoreboard contenders={contenders} dates={[...dates].reverse()} currentId={userId} />
    </main>
  );
}
