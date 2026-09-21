import { ProgressBar } from "@/components/ProgressBar";
import { MealsList } from "@/components/MealsList";
import { SupplementsList } from "@/components/SupplementsList";
import { TrainingCard } from "@/components/TrainingCard";
import { WeekView } from "@/components/WeekView";
import { ActivityDoneCheckbox } from "@/components/ActivityDoneCheckbox";
import { getContent, getDailyLog } from "@/lib/db";
import {
  getDayPattern,
  getExercisesForWeek,
  getProgramDay,
  getWeekNumber,
  isRestActivity,
  todayIso,
} from "@/lib/program";
import { setActivityChoice } from "@/app/actions";

const WEEKDAY_NAMES = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];

export default async function HojePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const date = dateParam ?? todayIso();
  const today = todayIso();

  const [program, weekPattern, workoutPlan, meals, supplements, dailyLog] = await Promise.all([
    getContent("program"),
    getContent("weekPattern"),
    getContent("workoutPlan"),
    getContent("meals"),
    getContent("supplements"),
    getDailyLog(date),
  ]);

  const programDay = getProgramDay(date, program.startDate);
  const weekNumber = getWeekNumber(programDay);
  const pattern = getDayPattern(date, weekPattern, dailyLog);

  const workoutBlock = pattern.trainingBlock ? workoutPlan[pattern.trainingBlock] : null;
  if (pattern.trainingBlock && !workoutBlock) {
    throw new Error(`workoutPlan has no entry for block "${pattern.trainingBlock}"`);
  }

  const mealsDoneCount = meals.filter((m) => dailyLog?.meals[m.id]?.done).length;
  const trainingDaysThisWeek = weekPattern.filter((p) => p.trainingBlock).length;

  const totalProgramDays = program.durationWeeks * 7;
  const daysRemaining = Math.max(0, totalProgramDays - programDay + 1);
  const weeksRemaining = Math.max(0, program.durationWeeks - weekNumber);

  const jsDay = new Date(`${date}T00:00:00Z`).getUTCDay();
  const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;

  return (
    <main className="space-y-4 p-4 pt-6">
      <div>
        <h1 className="font-display text-3xl font-semibold leading-none text-paper">
          {date === today ? "Hoje" : WEEKDAY_NAMES[dayOfWeek]}
        </h1>
        <p className="mt-1 text-sm text-paper-dim">
          Semana {weekNumber} de {program.durationWeeks}
          {weeksRemaining > 0
            ? ` · faltam ${weeksRemaining} ${weeksRemaining === 1 ? "semana" : "semanas"} (${daysRemaining} dias)`
            : " · última semana!"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-line bg-ink-raised p-3">
          <p className="text-xs text-paper-faint">Refeições hoje</p>
          <p className="mb-2 font-display text-2xl font-semibold text-paper">{mealsDoneCount}/{meals.length}</p>
          <ProgressBar value={mealsDoneCount} max={meals.length} />
        </div>
        <div className="rounded-lg border border-line bg-ink-raised p-3">
          <p className="text-xs text-paper-faint">Treinos na semana</p>
          <p className="mb-2 font-display text-2xl font-semibold text-paper">{dailyLog?.training_done ? 1 : 0}/{trainingDaysThisWeek}</p>
          <ProgressBar value={dailyLog?.training_done ? 1 : 0} max={trainingDaysThisWeek} />
        </div>
      </div>

      <WeekView today={today} />

      {pattern.trainingBlock && workoutBlock ? (
        <TrainingCard
          key={date}
          date={date}
          block={pattern.trainingBlock}
          focus={workoutBlock.focus}
          exercises={getExercisesForWeek(workoutBlock, weekNumber)}
          exercisesDone={dailyLog?.exercises_done ?? {}}
          trainingDone={dailyLog?.training_done ?? false}
          label="Treino de hoje"
        />
      ) : (
        <ActivityPicker date={date} pattern={pattern} trainingDone={dailyLog?.training_done ?? false} />
      )}

      <MealsList key={date} date={date} meals={meals} mealLogs={dailyLog?.meals ?? {}} />
      <SupplementsList key={date} date={date} supplements={supplements} supplementLogs={dailyLog?.supplements ?? {}} />
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
  const showDoneCheckbox = pattern.activity !== null && !isRestActivity(pattern.activity);
  return (
    <div className="rounded-lg border border-line bg-ink-raised p-4">
      <p className="font-display text-lg font-medium text-paper">Atividade de hoje</p>
      <form action={pick} className="mt-2">
        <div className="flex flex-wrap gap-2">
          {pattern.activityOptions.map((option: string) => (
            <button
              key={option}
              type="submit"
              name="activity"
              value={option}
              className={`min-h-11 rounded-full px-4 text-sm transition-colors ${
                pattern.activity === option
                  ? "bg-ember text-ink font-medium"
                  : "border border-line-bright bg-ink-field text-paper-dim active:bg-ink"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </form>
      {showDoneCheckbox && (
        <div className="mt-3 border-t border-line pt-3">
          <ActivityDoneCheckbox key={date} date={date} trainingDone={trainingDone} />
        </div>
      )}
    </div>
  );
}
