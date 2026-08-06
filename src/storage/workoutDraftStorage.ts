import * as FileSystem from 'expo-file-system/legacy';
import { WorkoutExerciseEntry } from '../types';

export type WorkoutDraft = {
  version: 1;
  isWorkoutStarted: true;
  updatedAt: string;
  selectedWorkoutTagIds: string[];
  workoutNotes: string;
  workoutExercises: WorkoutExerciseEntry[];
  expandedWorkoutExerciseId: string | null;
};

const draftFileUri = FileSystem.documentDirectory
  ? `${FileSystem.documentDirectory}unfinished-workout.json`
  : null;

let writeQueue = Promise.resolve();

export async function loadWorkoutDraft(): Promise<WorkoutDraft | null> {
  if (!draftFileUri) {
    return null;
  }

  const fileInfo = await FileSystem.getInfoAsync(draftFileUri);
  if (!fileInfo.exists) {
    return null;
  }

  const value: unknown = JSON.parse(await FileSystem.readAsStringAsync(draftFileUri));
  return isWorkoutDraft(value) ? value : null;
}

export function saveWorkoutDraft(draft: WorkoutDraft): Promise<void> {
  if (!draftFileUri) {
    return Promise.resolve();
  }

  writeQueue = writeQueue.catch(() => undefined).then(() =>
    FileSystem.writeAsStringAsync(draftFileUri, JSON.stringify(draft, null, 2)),
  );
  return writeQueue;
}

export function removeWorkoutDraft(): Promise<void> {
  if (!draftFileUri) {
    return Promise.resolve();
  }

  writeQueue = writeQueue.catch(() => undefined).then(() =>
    FileSystem.deleteAsync(draftFileUri, { idempotent: true }),
  );
  return writeQueue;
}

function isWorkoutDraft(value: unknown): value is WorkoutDraft {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const draft = value as Partial<WorkoutDraft>;
  return draft.version === 1
    && draft.isWorkoutStarted === true
    && typeof draft.updatedAt === 'string'
    && Array.isArray(draft.selectedWorkoutTagIds)
    && typeof draft.workoutNotes === 'string'
    && Array.isArray(draft.workoutExercises)
    && (typeof draft.expandedWorkoutExerciseId === 'string'
      || draft.expandedWorkoutExerciseId === null);
}
