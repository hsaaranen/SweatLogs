export type DataSearchMode = 'exercise' | 'exerciseTag' | 'workoutTag';

export type ExerciseSetType = 'Strength' | 'Duration' | 'RepsOnly' | 'Distance' | 'DistanceDuration';

export type NoticeTone = 'error' | 'success';

export type Notice = {
  tone: NoticeTone;
  message: string;
};

export type Exercise = {
  id: string;
  name: string;
  description: string;
  setType: ExerciseSetType;
};

export type WorkoutTag = {
  id: string;
  name: string;
  color: string;
};

export type WorkoutTemplate = {
  id: string;
  name: string;
  createdAt: string;
  tags: WorkoutTag[];
  exercises: WorkoutTemplateExercise[];
};

export type WorkoutTemplateExercise = {
  exercise: Exercise;
  setCount: number;
  sets: WorkoutSet[];
};

export type ExerciseTag = {
  id: string;
  name: string;
  color: string;
};

export type WorkoutSet = {
  id: string;
  reps: string;
  weight: string;
  durationMinutes: string;
  durationSeconds: string;
  distanceKm: string;
};

export type WorkoutExerciseEntry = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  setType: ExerciseSetType;
  selectedExerciseTagIds: string[];
  sets: WorkoutSet[];
};

export type ExerciseTotals = {
  setCount: number;
  totalReps: number;
  maxWeight: number;
  totalVolume: number;
  totalDurationSeconds: number;
  totalDistanceMeters: number;
};

export type WorkoutTotals = {
  exerciseCount: number;
  setCount: number;
  totalReps: number;
  totalVolume: number;
  totalDurationSeconds: number;
  totalDistanceMeters: number;
};

export type WorkoutSetHistory = {
  setNumber: number;
  reps: number | null;
  weight: number | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
};

export type WorkoutExerciseHistory = ExerciseTotals & {
  id: string;
  exerciseName: string;
  setType: ExerciseSetType;
  tags: ExerciseTag[];
  sets: WorkoutSetHistory[];
};

export type WorkoutHistory = {
  id: string;
  tags: WorkoutTag[];
  notes: string;
  completedAt: string;
  completedDateKey: string;
  setCount: number;
  totalVolume: number;
  exercises: WorkoutExerciseHistory[];
};

export type ExerciseRecordSet = {
  setNumber: number;
  reps: number | null;
  weight: number | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
};

export type ExerciseRecord = ExerciseTotals & {
  id: string;
  workoutId: string;
  setType: ExerciseSetType;
  tags: ExerciseTag[];
  completedAt: string;
  completedDateKey: string;
  sets: ExerciseRecordSet[];
};
