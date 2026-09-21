export interface Program {
  startDate: string; // "YYYY-MM-DD"
  durationWeeks: number;
}

export interface WeekPatternEntry {
  dayOfWeek: number; // 0 = Monday .. 6 = Sunday
  trainingBlock: string | null; // key into WorkoutPlan.blocks
  activity: string | null;
  activityEditable: boolean;
  activityOptions: string[];
}

export interface Exercise {
  name: string;
  scheme: string; // prescribed sets, e.g. "2x8-10 · 1x15"
  note?: string; // technique note, e.g. "triplo drop set na última série"
}

export interface WorkoutBlockContent {
  label: string; // "Pull", "Legs 2"
  short: string; // week-strip marker, e.g. "P", "L2"
  focus: string; // "Costas e bíceps"
  exercises: Exercise[];
}

export interface WorkoutPlan {
  guidelines: string[];
  blocks: Record<string, WorkoutBlockContent>;
}

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
