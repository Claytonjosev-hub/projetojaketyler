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

  return (
    <main className="space-y-4 p-4">
      <div>
        <h1 className="text-xl font-semibold">
          {date === today ? "Hoje" : new Date(`${date}T00:00:00Z`).toLocaleDateString("pt-BR")}
        </h1>
        <p className="text-sm text-neutral-500">Semana {weekNumber} de 8</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-3">
          <p className="text-xs text-neutral-500">Refeições hoje</p>
          <p className="mb-1 text-lg font-semibold">{mealsDoneCount}/{meals.length}</p>
          <ProgressBar value={mealsDoneCount} max={meals.length} />
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-3">
          <p className="text-xs text-neutral-500">Treinos na semana</p>
          <p className="mb-1 text-lg font-semibold">{dailyLog?.training_done ? 1 : 0}/{trainingDaysThisWeek}</p>
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
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <form action={pick}>
        <p className="mb-2 font-medium">Atividade de hoje</p>
        <div className="flex flex-wrap gap-2">
          {pattern.activityOptions.map((option: string) => (
            <button
              key={option}
              type="submit"
              name="activity"
              value={option}
              className={`rounded-full px-3 py-1.5 text-sm ${
                pattern.activity === option ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </form>
      {showDoneCheckbox && (
        <div className="mt-3 border-t border-neutral-100 pt-3">
          <ActivityDoneCheckbox key={date} date={date} trainingDone={trainingDone} />
        </div>
      )}
    </div>
  );
}
