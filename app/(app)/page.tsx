import { ProgressBar } from "@/components/ProgressBar";
import { MealsList } from "@/components/MealsList";
import { SupplementsList } from "@/components/SupplementsList";
import { TrainingCard } from "@/components/TrainingCard";
import { WeekView } from "@/components/WeekView";
import { ActivityDoneCheckbox } from "@/components/ActivityDoneCheckbox";
import { DayNote } from "@/components/DayNote";
import { UserPill } from "@/components/UserPill";
import { getContent, getDailyLog } from "@/lib/db";
import { getSession } from "@/lib/session";
import {
  formatDayMonth,
  getDayOfWeek,
  getDayPattern,
  getProgramDay,
  getWeekNumber,
  isRestActivity,
  todayIso,
} from "@/lib/program";
import { setActivityChoice } from "@/app/actions";

const WEEKDAY_NAMES = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
export default async function HojePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const date = dateParam ?? todayIso();
  const today = todayIso();

  const { users, current } = await getSession();
  const userId = current!.id;

  const [program, weekPattern, workoutPlan, meals, supplements, dailyLog] = await Promise.all([
    getContent(userId, "program"),
    getContent(userId, "weekPattern"),
    getContent(userId, "workoutPlan"),
    getContent(userId, "meals"),
    getContent(userId, "supplements"),
    getDailyLog(userId, date),
  ]);

  const programDay = getProgramDay(date, program.startDate);
  const weekNumber = getWeekNumber(programDay);
  const pattern = getDayPattern(date, weekPattern, dailyLog);

  const workoutBlock = pattern.trainingBlock ? workoutPlan.blocks[pattern.trainingBlock] : null;
  if (pattern.trainingBlock && !workoutBlock) {
    throw new Error(`workoutPlan has no block "${pattern.trainingBlock}"`);
  }

  const dayOfWeek = getDayOfWeek(date);

  const daysRemaining = Math.max(0, program.durationWeeks * 7 - programDay + 1);

  const requiresTraining = Boolean(pattern.trainingBlock) || !isRestActivity(pattern.activity);
  const mealsDone = meals.filter((m) => dailyLog?.meals[m.id]?.done).length;
  const supplementsDone = supplements.filter((s) => dailyLog?.supplements[s.id]).length;
  const dayTotal = meals.length + supplements.length + (requiresTraining ? 1 : 0);
  const dayDone =
    mealsDone + supplementsDone + (requiresTraining && dailyLog?.training_done ? 1 : 0);

  return (
    <main className="mx-auto max-w-lg space-y-3 p-4 pt-8">
      <header className="px-1 pb-1">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h1 className="text-[32px] font-extrabold leading-none tracking-tight">
            {date === today ? "Hoje" : WEEKDAY_NAMES[dayOfWeek]}
          </h1>
          <UserPill users={users} currentId={userId} />
        </div>
        <p className="text-sm text-ink-dim">
          {date === today ? `${WEEKDAY_NAMES[dayOfWeek].toLowerCase()}, ` : ""}
          {formatDayMonth(date)}
        </p>
        <p className="tnum mt-0.5 text-sm text-ink-faint">
          Semana {weekNumber} de {program.durationWeeks} · faltam {daysRemaining} dias
        </p>

        <div className="mt-4 flex items-center gap-3">
          <ProgressBar value={dayDone} max={dayTotal} />
          <span className="tnum shrink-0 text-sm font-medium text-ink-dim">
            {dayDone}/{dayTotal}
          </span>
        </div>
      </header>

      <WeekView userId={userId} today={today} viewing={date} />

      {workoutBlock ? (
        <TrainingCard
          key={date}
          date={date}
          label={workoutBlock.label}
          focus={workoutBlock.focus}
          cardio={pattern.activity}
          exercises={workoutBlock.exercises}
          exercisesDone={dailyLog?.exercises_done ?? {}}
          trainingDone={dailyLog?.training_done ?? false}
          guidelines={workoutPlan.guidelines}
        />
      ) : (
        <ActivityPicker date={date} pattern={pattern} trainingDone={dailyLog?.training_done ?? false} />
      )}

      <MealsList key={date} date={date} meals={meals} mealLogs={dailyLog?.meals ?? {}} />
      <SupplementsList
        key={date}
        date={date}
        supplements={supplements}
        supplementLogs={dailyLog?.supplements ?? {}}
      />

      <DayNote key={`note-${date}`} date={date} note={dailyLog?.note ?? ""} />
    </main>
  );
}

async function ActivityPicker({
  date,
  pattern,
  trainingDone,
}: {
  date: string;
  pattern: ReturnType<typeof getDayPattern>;
  trainingDone: boolean;
}) {
  async function pick(formData: FormData) {
    "use server";
    const activity = String(formData.get("activity"));
    await setActivityChoice(date, activity || null);
  }
  const showDoneCheckbox = !isRestActivity(pattern.activity);
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="text-xs font-medium text-ink-faint">Dia sem musculação</p>
      <p className="mt-1 text-3xl font-extrabold leading-none tracking-tight">Descanso</p>
      <p className="mt-1.5 text-sm text-ink-dim">Escolha a atividade do dia</p>
      <form action={pick} className="mt-4 flex flex-wrap gap-2">
        {pattern.activityOptions.map((option: string) => (
          <button
            key={option}
            type="submit"
            name="activity"
            value={option}
            className={`min-h-11 rounded-full px-4 text-sm font-medium transition-colors ${
              pattern.activity === option
                ? "bg-ink text-surface"
                : "border border-line-strong text-ink-dim active:bg-canvas"
            }`}
          >
            {option}
          </button>
        ))}
      </form>
      {showDoneCheckbox && (
        <div className="mt-2 border-t border-line pt-1">
          <ActivityDoneCheckbox key={date} date={date} trainingDone={trainingDone} />
        </div>
      )}
    </div>
  );
}
