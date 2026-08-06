import {
  CreateWorkoutRequest,
  ExerciseRecordResponse,
  WorkoutResponse,
} from '../api/gymLogsApi';
import {
  Exercise,
  ExerciseRecord,
  ExerciseRecordSet,
  ExerciseSetType,
  ExerciseTag,
  ExerciseTotals,
  WorkoutExerciseEntry,
  WorkoutHistory,
  WorkoutSet,
  WorkoutSetHistory,
  WorkoutTag,
} from '../types';

export const DEFAULT_WORKOUT_LABEL = 'Untagged workout';
export const DEFAULT_WORKOUT_TAG_COLOR = '#9AA59E';
export const DEFAULT_EXERCISE_SET_TYPE: ExerciseSetType = 'Strength';
export const MIN_WORKOUT_SETS = 1;
export const MAX_WORKOUT_SETS = 15;

export const EXERCISE_SET_TYPE_OPTIONS: { value: ExerciseSetType; label: string }[] = [
  { value: 'Strength', label: 'Strength' },
  { value: 'Duration', label: 'Duration' },
  { value: 'RepsOnly', label: 'Reps only' },
  { value: 'Distance', label: 'Distance' },
  { value: 'DistanceDuration', label: 'Distance + time' },
];

export const createId = () => Math.random().toString(36).slice(2);

export const createEmptySet = (): WorkoutSet => ({
  id: createId(),
  reps: '',
  weight: '',
  durationMinutes: '',
  durationSeconds: '',
  distanceKm: '',
});

export const createDefaultSets = (count = 3) =>
  Array.from({ length: count }, () => createEmptySet());

export const calculateTotals = (sets: WorkoutSet[]): ExerciseTotals => {
  const parsedSets = sets.map((set) => ({
    reps: Number(set.reps) || 0,
    weight: parseDecimal(set.weight) ?? 0,
    durationSeconds: getDraftDurationSeconds(set),
    distanceMeters: (parseDecimal(set.distanceKm) ?? 0) * 1000,
  }));

  return {
    setCount: parsedSets.length,
    totalReps: parsedSets.reduce((sum, set) => sum + set.reps, 0),
    maxWeight: Math.max(0, ...parsedSets.map((set) => set.weight)),
    totalVolume: parsedSets.reduce((sum, set) => sum + set.reps * set.weight, 0),
    totalDurationSeconds: parsedSets.reduce((sum, set) => sum + set.durationSeconds, 0),
    totalDistanceMeters: parsedSets.reduce((sum, set) => sum + set.distanceMeters, 0),
  };
};

export const sortExercises = (items: Exercise[]) =>
  [...items].sort((left, right) => left.name.localeCompare(right.name));

export const sortWorkoutTags = (items: WorkoutTag[]) =>
  [...items].sort((left, right) => left.name.localeCompare(right.name));

export const sortExerciseTags = (items: ExerciseTag[]) =>
  [...items].sort((left, right) => left.name.localeCompare(right.name));

export const formatWorkoutTagLabel = (tags: WorkoutTag[]) =>
  tags.length > 0 ? tags.map((tag) => tag.name).join(' / ') : DEFAULT_WORKOUT_LABEL;

export const normalizeExerciseSearch = (value: string) => value.trim().toLocaleLowerCase();

export const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Something went wrong.';

export const getExerciseSetTypeLabel = (setType: ExerciseSetType) =>
  EXERCISE_SET_TYPE_OPTIONS.find((option) => option.value === setType)?.label ?? setType;

export function formatLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function buildWorkoutRequest(
  selectedWorkoutTagIds: string[],
  workoutNotes: string,
  workoutExercises: WorkoutExerciseEntry[],
): { request: CreateWorkoutRequest } | { error: string } {
  const notes = workoutNotes.trim();

  if (selectedWorkoutTagIds.length === 0) {
    return { error: 'Workout focus is required.' };
  }

  if (notes.length > 2000) {
    return { error: 'Workout notes must be 2000 characters or fewer.' };
  }

  const exercises = [];

  for (const exercise of workoutExercises) {
    if (exercise.sets.length > MAX_WORKOUT_SETS) {
      return { error: `${exercise.exerciseName} can have at most ${MAX_WORKOUT_SETS} sets.` };
    }

    const sets = [];

    for (const set of exercise.sets) {
      if (isWorkoutSetEmpty(exercise.setType, set)) {
        continue;
      }

      const setResult = buildWorkoutSetRequest(exercise.setType, exercise.exerciseName, set);
      if ('error' in setResult) {
        return setResult;
      }

      sets.push(setResult.set);
    }

    if (sets.length === 0) {
      return { error: `Add at least one completed set for ${exercise.exerciseName}.` };
    }

    exercises.push({
      exerciseId: exercise.exerciseId,
      tags: exercise.selectedExerciseTagIds.length > 0
        ? exercise.selectedExerciseTagIds.map((tagId) => ({ id: tagId }))
        : null,
      sets,
    });
  }

  return {
    request: {
      tags: selectedWorkoutTagIds.map((tagId) => ({ id: tagId })),
      notes,
      startedAt: null,
      completedAt: null,
      exercises,
    },
  };
}

export function mapWorkoutToHistory(workout: WorkoutResponse): WorkoutHistory {
  const completedDate = new Date(workout.completedAt);
  const exercises = workout.exercises.map((exercise) => {
    const totalReps = exercise.sets.reduce((sum, set) => sum + (set.reps ?? 0), 0);
    const totalVolume = exercise.sets.reduce(
      (sum, set) => sum + (set.reps ?? 0) * (set.weight ?? 0),
      0,
    );
    const totalDurationSeconds = exercise.sets.reduce(
      (sum, set) => sum + (set.durationSeconds ?? 0),
      0,
    );
    const totalDistanceMeters = exercise.sets.reduce(
      (sum, set) => sum + (set.distanceMeters ?? 0),
      0,
    );

    return {
      id: exercise.id,
      exerciseName: exercise.exerciseName,
      setType: exercise.setType ?? DEFAULT_EXERCISE_SET_TYPE,
      tags: exercise.tags ?? [],
      sets: exercise.sets.map((set) => ({
        setNumber: set.setNumber,
        reps: set.reps ?? null,
        weight: set.weight ?? null,
        durationSeconds: set.durationSeconds ?? null,
        distanceMeters: set.distanceMeters ?? null,
      })),
      setCount: exercise.sets.length,
      totalReps,
      maxWeight: Math.max(0, ...exercise.sets.map((set) => set.weight ?? 0)),
      totalVolume,
      totalDurationSeconds,
      totalDistanceMeters,
    };
  });

  return {
    id: workout.id,
    tags: workout.tags ?? [],
    notes: workout.notes?.trim() ?? '',
    completedAt: completedDate.toLocaleDateString(),
    completedDateKey: formatLocalDateKey(completedDate),
    exercises,
    setCount: exercises.reduce((sum, exercise) => sum + exercise.setCount, 0),
    totalVolume: exercises.reduce((sum, exercise) => sum + exercise.totalVolume, 0),
  };
}

export function mapExerciseRecordToData(record: ExerciseRecordResponse): ExerciseRecord {
  const completedDate = new Date(record.completedAt);
  const totalDurationSeconds = record.sets.reduce(
    (sum, set) => sum + (set.durationSeconds ?? 0),
    0,
  );
  const totalDistanceMeters = record.sets.reduce(
    (sum, set) => sum + (set.distanceMeters ?? 0),
    0,
  );

  return {
    id: record.id,
    workoutId: record.workoutId,
    setType: record.setType ?? DEFAULT_EXERCISE_SET_TYPE,
    tags: record.tags ?? [],
    completedAt: completedDate.toLocaleDateString(),
    completedDateKey: formatLocalDateKey(completedDate),
    sets: record.sets.map((set) => ({
      setNumber: set.setNumber,
      reps: set.reps ?? null,
      weight: set.weight ?? null,
      durationSeconds: set.durationSeconds ?? null,
      distanceMeters: set.distanceMeters ?? null,
    })),
    setCount: record.setCount,
    totalReps: record.totalReps,
    maxWeight: record.maxWeight,
    totalVolume: record.totalVolume,
    totalDurationSeconds,
    totalDistanceMeters,
  };
}

export function formatSetMetrics(set: WorkoutSetHistory | ExerciseRecordSet) {
  const metrics: string[] = [];

  if (set.reps !== null) {
    metrics.push(`${set.reps} reps`);
  }

  if (set.weight !== null) {
    metrics.push(`${formatMetric(set.weight)} kg`);
  }

  if (set.distanceMeters !== null) {
    metrics.push(formatDistanceMeters(set.distanceMeters));
  }

  if (set.durationSeconds !== null) {
    metrics.push(formatDurationSeconds(set.durationSeconds));
  }

  return metrics;
}

export function formatMetric(value: number) {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(1).replace(/\.0$/, '');
}

function buildWorkoutSetRequest(
  setType: ExerciseSetType,
  exerciseName: string,
  set: WorkoutSet,
):
  | {
      set: NonNullable<CreateWorkoutRequest['exercises'][number]['sets']>[number];
    }
  | { error: string } {
  switch (setType) {
    case 'Strength': {
      const reps = parsePositiveInteger(set.reps);
      if (reps === null) {
        return { error: `Reps must be a positive whole number for ${exerciseName}.` };
      }

      const weight = parseZeroOrPositiveDecimal(set.weight);
      if (weight === null) {
        return { error: `Weight must be zero or more for ${exerciseName}.` };
      }

      return { set: { reps, weight } };
    }
    case 'RepsOnly': {
      const reps = parsePositiveInteger(set.reps);
      if (reps === null) {
        return { error: `Reps must be a positive whole number for ${exerciseName}.` };
      }

      return { set: { reps } };
    }
    case 'Duration': {
      const durationResult = parseDurationInput(exerciseName, set);
      if ('error' in durationResult) {
        return durationResult;
      }

      return { set: { durationSeconds: durationResult.durationSeconds } };
    }
    case 'Distance': {
      const distanceMeters = parseDistanceMeters(set.distanceKm);
      if (distanceMeters === null) {
        return { error: `Distance must be a positive number of kilometers for ${exerciseName}.` };
      }

      return { set: { distanceMeters } };
    }
    case 'DistanceDuration': {
      const distanceMeters = parseDistanceMeters(set.distanceKm);
      if (distanceMeters === null) {
        return { error: `Distance must be a positive number of kilometers for ${exerciseName}.` };
      }

      const durationResult = parseDurationInput(exerciseName, set);
      if ('error' in durationResult) {
        return durationResult;
      }

      return { set: { distanceMeters, durationSeconds: durationResult.durationSeconds } };
    }
  }
}
function isWorkoutSetEmpty(setType: ExerciseSetType, set: WorkoutSet) {
  switch (setType) {
    case 'Strength':
      return !set.reps.trim() && !set.weight.trim();
    case 'RepsOnly':
      return !set.reps.trim();
    case 'Duration':
      return !set.durationMinutes.trim() && !set.durationSeconds.trim();
    case 'Distance':
      return !set.distanceKm.trim();
    case 'DistanceDuration':
      return !set.distanceKm.trim() && !set.durationMinutes.trim() && !set.durationSeconds.trim();
  }
}

function getDraftDurationSeconds(set: WorkoutSet) {
  return parseDurationPartForTotals(set.durationMinutes) * 60
    + parseDurationPartForTotals(set.durationSeconds);
}

function parseDurationInput(
  exerciseName: string,
  set: WorkoutSet,
): { durationSeconds: number } | { error: string } {
  const minutes = parseDurationPart(set.durationMinutes);
  const seconds = parseDurationPart(set.durationSeconds);

  if (minutes === null || seconds === null) {
    return { error: `Time must use whole minutes and seconds for ${exerciseName}.` };
  }

  if (seconds > 59) {
    return { error: `Seconds must be between 0 and 59 for ${exerciseName}.` };
  }

  const durationSeconds = minutes * 60 + seconds;
  if (durationSeconds <= 0) {
    return { error: `Time must be greater than zero for ${exerciseName}.` };
  }

  return { durationSeconds };
}

function parseDurationPart(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }

  const parsed = Number(trimmed);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function parseDurationPartForTotals(value: string) {
  const parsed = parseDurationPart(value);
  return parsed ?? 0;
}

function parsePositiveInteger(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseZeroOrPositiveDecimal(value: string) {
  const parsed = parseDecimal(value);
  return parsed !== null && parsed >= 0 ? parsed : null;
}

function parseDistanceMeters(value: string) {
  const distanceKm = parseDecimal(value);
  if (distanceKm === null || distanceKm <= 0) {
    return null;
  }

  return Number((distanceKm * 1000).toFixed(2));
}

function parseDecimal(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDurationSeconds(totalSeconds: number) {
  const roundedSeconds = Math.round(totalSeconds);
  const minutes = Math.floor(roundedSeconds / 60);
  const seconds = roundedSeconds % 60;

  if (minutes > 0 && seconds > 0) {
    return `${minutes} min ${seconds} sec`;
  }

  if (minutes > 0) {
    return `${minutes} min`;
  }

  return `${seconds} sec`;
}

function formatDistanceMeters(distanceMeters: number) {
  if (distanceMeters >= 1000) {
    return `${formatMetric(distanceMeters / 1000)} km`;
  }

  return `${formatMetric(distanceMeters)} m`;
}
