import { ExerciseSetType } from '../types';

export type ExerciseResponse = {
  id: string;
  name: string;
  setType: ExerciseSetType;
};

export type WorkoutTagResponse = {
  id: string;
  name: string;
  color: string;
};

export type ExerciseTagResponse = {
  id: string;
  name: string;
  color: string;
};

export type WorkoutTemplateResponse = {
  id: string;
  name: string;
  createdAt: string;
  tags: WorkoutTagResponse[];
  exercises: {
    exercise: ExerciseResponse;
    setCount: number;
  }[];
};

export type WorkoutSetResponse = {
  setNumber: number;
  reps?: number | null;
  weight?: number | null;
  durationSeconds?: number | null;
  distanceMeters?: number | null;
};

export type WorkoutExerciseResponse = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  setType: ExerciseSetType;
  sets: WorkoutSetResponse[];
  tags?: ExerciseTagResponse[] | null;
};

export type WorkoutResponse = {
  id: string;
  tags?: WorkoutTagResponse[] | null;
  notes?: string;
  startedAt: string;
  completedAt: string;
  exercises: WorkoutExerciseResponse[];
};

export type ExerciseRecordResponse = {
  id: string;
  workoutId: string;
  completedAt: string;
  setType: ExerciseSetType;
  setCount: number;
  totalReps: number;
  maxWeight: number;
  totalVolume: number;
  sets: WorkoutSetResponse[];
  tags?: ExerciseTagResponse[] | null;
};

export type ExerciseRecordsResponse = {
  exerciseId: string;
  exerciseName: string;
  records: ExerciseRecordResponse[];
};

export type CreateWorkoutRequest = {
  tags?: { id: string }[] | null;
  notes: string;
  startedAt: string | null;
  completedAt: string | null;
  exercises: {
    exerciseId: string;
    tags?: { id: string }[] | null;
    sets: {
      reps?: number | null;
      weight?: number | null;
      durationSeconds?: number | null;
      distanceMeters?: number | null;
    }[];
  }[];
};

export type UpdateExerciseRecordRequest = {
  sets: CreateWorkoutRequest['exercises'][number]['sets'];
};
