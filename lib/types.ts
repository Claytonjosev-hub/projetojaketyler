export type TrainingBlock = "A" | "B" | "C" | "D" | "E";

export interface Program {
  startDate: string; // "YYYY-MM-DD"
  durationWeeks: number;
}

export interface WeekPatternEntry {
  dayOfWeek: number; // 0 = Monday .. 6 = Sunday
  trainingBlock: TrainingBlock | null;
  activity: string | null;
  activityEditable: boolean;
  activityOptions: string[];
}

export interface Exercise {
  name: string;
  reps: string;
  tempo: string;
  sets: number[]; // length 8, sets[i] = sets prescribed in program week i+1
}

export interface WorkoutBlockContent {
  focus: string;
  exercises: Exercise[];
}

export type WorkoutPlan = Record<TrainingBlock, WorkoutBlockContent>;

export interface MealOption {
  title: string;
  items: string;
}

export interface Meal {
  id: string;
  time: string; // "HH:MM"
  name: string;
  options: MealOption[];
}

export interface Supplement {
  id: string;
  name: string;
  dose: string;
}

export interface ContentShape {
  program: Program;
  weekPattern: WeekPatternEntry[];
  workoutPlan: WorkoutPlan;
  meals: Meal[];
  supplements: Supplement[];
}

export type ContentKey = keyof ContentShape;

export interface MealLogEntry {
  chosenOptionIndex: number;
  done: boolean;
}

export interface DailyLog {
  date: string;
  training_done: boolean;
  exercises_done: Record<string, boolean>;
  activity_choice: string | null;
  meals: Record<string, MealLogEntry>;
  supplements: Record<string, boolean>;
}
