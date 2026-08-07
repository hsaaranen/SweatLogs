import * as SQLite from 'expo-sqlite';
import { File } from 'expo-file-system';
import { ExerciseSetType } from '../types';
import {
  CreateWorkoutRequest,
  ExerciseRecordResponse,
  ExerciseRecordsResponse,
  ExerciseResponse,
  ExerciseTagResponse,
  UpdateExerciseRecordRequest,
  WorkoutExerciseResponse,
  WorkoutResponse,
  WorkoutSetResponse,
  WorkoutTagResponse,
  WorkoutTemplateResponse,
} from './gymLogsDataTypes';

type SQLiteDatabase = Awaited<ReturnType<typeof SQLite.openDatabaseAsync>>;

type ExerciseRow = {
  id: string;
  name: string;
  setType: ExerciseSetType;
  createdAt: string;
  archivedAt: string | null;
};

type TagRow = {
  id: string;
  name: string;
  color: string;
  archivedAt: string | null;
};

type WorkoutRow = {
  id: string;
  notes: string;
  startedAt: string;
  completedAt: string;
};

type WorkoutExerciseRow = {
  id: string;
  exerciseId: string;
  exerciseName: string | null;
  setType: ExerciseSetType;
  sortOrder: number;
};

type WorkoutSetRow = {
  setNumber: number;
  reps: number | null;
  weight: number | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
};

type WorkoutTemplateRow = {
  id: string;
  name: string;
  createdAt: string;
};

type WorkoutTemplateExerciseRow = {
  exerciseId: string;
  exerciseName: string | null;
  setType: ExerciseSetType | null;
  setCount: number;
  sortOrder: number;
};

type CountRow = { count: number };
type MetadataRow = { value: string };

const databaseName = 'sweatlogs.db';
const seedVersionKey = 'starterSeedVersion';
const seedVersion = '1';
const maxWorkoutSetCount = 15;
const exerciseSetTypes: ExerciseSetType[] = [
  'Strength',
  'Duration',
  'RepsOnly',
  'Distance',
  'DistanceDuration',
];

let databasePromise: Promise<SQLiteDatabase> | null = null;

export const localGymLogsStore = {
  getExercises,
  getWorkoutFocuses,
  getExerciseMarkers,
  getWorkoutTemplates,
  createExercise,
  createWorkoutTag,
  createExerciseTag,
  createWorkout,
  createWorkoutTemplate,
  updateWorkoutTemplate,
  getExerciseTagExercises,
  getWorkoutTagWorkouts,
  getRecentWorkouts,
  getExerciseRecords,
  updateExerciseRecord,
  deleteExerciseRecord,
  deleteExercise,
  deleteWorkoutTag,
  deleteExerciseTag,
  deleteWorkout,
  deleteWorkoutTemplate,
  exportDatabase,
  importDatabase,
};

async function exportDatabase() {
  const db = await getDatabase();
  return db.serializeAsync();
}

async function importDatabase(serializedDatabase: Uint8Array) {
  const importedDb = await SQLite.deserializeDatabaseAsync(serializedDatabase);

  try {
    const integrity = await importedDb.getFirstAsync<{ integrity_check: string }>(
      'PRAGMA integrity_check;',
    );
    if (integrity?.integrity_check !== 'ok') {
      throw new Error('The selected file is not a valid SQLite database.');
    }

    const requiredTables = [
      'app_metadata',
      'exercises',
      'workout_focuses',
      'exercise_markers',
      'workouts',
      'workout_exercises',
      'workout_sets',
      'workout_workout_focuses',
      'workout_exercise_exercise_markers',
      'workout_templates',
      'workout_template_exercises',
      'workout_template_workout_focuses',
    ];
    const tables = await importedDb.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table';",
    );
    const tableNames = new Set(tables.map((table) => table.name));
    if (requiredTables.some((table) => !tableNames.has(table))) {
      throw new Error('The selected database is not a SweatLogs backup.');
    }

    const foreignKeyErrors = await importedDb.getAllAsync('PRAGMA foreign_key_check;');
    if (foreignKeyErrors.length > 0) {
      throw new Error('The selected backup contains invalid linked records.');
    }
  } finally {
    await importedDb.closeAsync();
  }

  const currentDb = await getDatabase();
  const currentDatabase = await currentDb.serializeAsync();
  await currentDb.closeAsync();
  databasePromise = null;

  const databaseFile = new File(SQLite.defaultDatabaseDirectory, databaseName);

  try {
    databaseFile.create({ overwrite: true, intermediates: true });
    databaseFile.write(serializedDatabase);
    await getDatabase();
  } catch (error) {
    databasePromise = null;
    databaseFile.create({ overwrite: true, intermediates: true });
    databaseFile.write(currentDatabase);
    await getDatabase();
    throw error;
  }
}

async function getDatabase() {
  if (!databasePromise) {
    databasePromise = openAndInitializeDatabase();
  }

  return databasePromise;
}

async function openAndInitializeDatabase() {
  const db = await SQLite.openDatabaseAsync(databaseName);
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS app_metadata (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      setType TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      archivedAt TEXT NULL
    );

    CREATE TABLE IF NOT EXISTS workout_focuses (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      archivedAt TEXT NULL
    );

    CREATE TABLE IF NOT EXISTS exercise_markers (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      archivedAt TEXT NULL
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY NOT NULL,
      notes TEXT NOT NULL,
      startedAt TEXT NOT NULL,
      completedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workout_exercises (
      id TEXT PRIMARY KEY NOT NULL,
      workoutId TEXT NOT NULL,
      exerciseId TEXT NOT NULL,
      setType TEXT NOT NULL,
      sortOrder INTEGER NOT NULL,
      FOREIGN KEY (workoutId) REFERENCES workouts(id) ON DELETE CASCADE,
      FOREIGN KEY (exerciseId) REFERENCES exercises(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS workout_sets (
      id TEXT PRIMARY KEY NOT NULL,
      workoutExerciseId TEXT NOT NULL,
      setNumber INTEGER NOT NULL,
      reps INTEGER NULL,
      weight REAL NULL,
      durationSeconds INTEGER NULL,
      distanceMeters REAL NULL,
      FOREIGN KEY (workoutExerciseId) REFERENCES workout_exercises(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS workout_workout_focuses (
      workoutId TEXT NOT NULL,
      workoutFocusId TEXT NOT NULL,
      PRIMARY KEY (workoutId, workoutFocusId),
      FOREIGN KEY (workoutId) REFERENCES workouts(id) ON DELETE CASCADE,
      FOREIGN KEY (workoutFocusId) REFERENCES workout_focuses(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS workout_exercise_exercise_markers (
      workoutExerciseId TEXT NOT NULL,
      exerciseMarkerId TEXT NOT NULL,
      PRIMARY KEY (workoutExerciseId, exerciseMarkerId),
      FOREIGN KEY (workoutExerciseId) REFERENCES workout_exercises(id) ON DELETE CASCADE,
      FOREIGN KEY (exerciseMarkerId) REFERENCES exercise_markers(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS workout_templates (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workout_template_workout_focuses (
      workoutTemplateId TEXT NOT NULL,
      workoutFocusId TEXT NOT NULL,
      PRIMARY KEY (workoutTemplateId, workoutFocusId),
      FOREIGN KEY (workoutTemplateId) REFERENCES workout_templates(id) ON DELETE CASCADE,
      FOREIGN KEY (workoutFocusId) REFERENCES workout_focuses(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS workout_template_exercises (
      id TEXT PRIMARY KEY NOT NULL,
      workoutTemplateId TEXT NOT NULL,
      exerciseId TEXT NOT NULL,
      sortOrder INTEGER NOT NULL,
      setCount INTEGER NOT NULL,
      FOREIGN KEY (workoutTemplateId) REFERENCES workout_templates(id) ON DELETE CASCADE,
      FOREIGN KEY (exerciseId) REFERENCES exercises(id) ON DELETE RESTRICT
    );

    CREATE INDEX IF NOT EXISTS ix_exercises_active_name ON exercises(name, archivedAt);
    CREATE INDEX IF NOT EXISTS ix_workout_focuses_active_name ON workout_focuses(name, archivedAt);
    CREATE INDEX IF NOT EXISTS ix_exercise_markers_active_name ON exercise_markers(name, archivedAt);
    CREATE INDEX IF NOT EXISTS ix_workouts_completed_at ON workouts(completedAt);
    CREATE INDEX IF NOT EXISTS ix_workout_exercises_workout_sort ON workout_exercises(workoutId, sortOrder);
    CREATE INDEX IF NOT EXISTS ix_workout_sets_exercise_set ON workout_sets(workoutExerciseId, setNumber);
    CREATE INDEX IF NOT EXISTS ix_workout_templates_name ON workout_templates(name);
  `);
  await seedStarterDataIfNeeded(db);
  return db;
}

async function seedStarterDataIfNeeded(db: SQLiteDatabase) {
  const seeded = await db.getFirstAsync<MetadataRow>(
    'SELECT value FROM app_metadata WHERE key = ?',
    seedVersionKey,
  );
  if (seeded?.value === seedVersion) {
    return;
  }

  const now = new Date().toISOString();
  await runInTransaction(db, async () => {
    for (const exercise of starterExercises) {
      await db.runAsync(
        'INSERT INTO exercises (id, name, setType, createdAt, archivedAt) VALUES (?, ?, ?, ?, NULL)',
        createId(),
        exercise.name,
        exercise.setType,
        now,
      );
    }

    for (const focus of starterWorkoutFocuses) {
      await db.runAsync(
        'INSERT INTO workout_focuses (id, name, color, archivedAt) VALUES (?, ?, ?, NULL)',
        createId(),
        focus.name,
        focus.color,
      );
    }

    for (const marker of starterExerciseMarkers) {
      await db.runAsync(
        'INSERT INTO exercise_markers (id, name, color, archivedAt) VALUES (?, ?, ?, NULL)',
        createId(),
        marker.name,
        marker.color,
      );
    }

    await db.runAsync(
      'INSERT OR REPLACE INTO app_metadata (key, value) VALUES (?, ?)',
      seedVersionKey,
      seedVersion,
    );
  });
}

async function runInTransaction<T>(db: SQLiteDatabase, action: () => Promise<T>) {
  await db.execAsync('BEGIN IMMEDIATE TRANSACTION;');
  try {
    const result = await action();
    await db.execAsync('COMMIT;');
    return result;
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    throw error;
  }
}

async function getExercises(): Promise<ExerciseResponse[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ExerciseRow>(
    'SELECT id, name, setType, createdAt, archivedAt FROM exercises WHERE archivedAt IS NULL ORDER BY name',
  );
  return rows.map(mapExerciseRow);
}

async function getWorkoutFocuses(): Promise<WorkoutTagResponse[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TagRow>(
    'SELECT id, name, color, archivedAt FROM workout_focuses WHERE archivedAt IS NULL ORDER BY name',
  );
  return rows.map(mapTagRow);
}

async function getExerciseMarkers(): Promise<ExerciseTagResponse[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TagRow>(
    'SELECT id, name, color, archivedAt FROM exercise_markers WHERE archivedAt IS NULL ORDER BY name',
  );
  return rows.map(mapTagRow);
}

async function createExercise(name: string, setType: ExerciseSetType): Promise<ExerciseResponse> {
  const db = await getDatabase();
  const trimmedName = name.trim();
  const normalizedSetType = normalizeSetType(setType);

  if (!trimmedName) {
    throw new Error('Exercise name is required.');
  }
  if (trimmedName.length > 120) {
    throw new Error('Exercise name must be 120 characters or fewer.');
  }
  if (!normalizedSetType) {
    throw new Error('Exercise set type is invalid.');
  }
  if (await findActiveByName(db, 'exercises', trimmedName)) {
    throw new Error('An exercise with this name already exists.');
  }

  const row: ExerciseRow = {
    id: createId(),
    name: trimmedName,
    setType: normalizedSetType,
    createdAt: new Date().toISOString(),
    archivedAt: null,
  };
  await db.runAsync(
    'INSERT INTO exercises (id, name, setType, createdAt, archivedAt) VALUES (?, ?, ?, ?, NULL)',
    row.id,
    row.name,
    row.setType,
    row.createdAt,
  );
  return mapExerciseRow(row);
}

async function createWorkoutTag(name: string, color: string): Promise<WorkoutTagResponse> {
  return createTag(
    'workout_focuses',
    name,
    color,
    'Workout focus name is required.',
    'Workout focus name must be 120 characters or fewer.',
    'Workout focus color must be a valid hex color code.',
    'A workout focus with this name already exists.',
  );
}

async function createExerciseTag(name: string, color: string): Promise<ExerciseTagResponse> {
  return createTag(
    'exercise_markers',
    name,
    color,
    'Exercise marker name is required.',
    'Exercise marker name must be 120 characters or fewer.',
    'Exercise marker color must be a valid hex color code.',
    'An exercise marker with this name already exists.',
  );
}

async function createTag(
  tableName: 'workout_focuses' | 'exercise_markers',
  name: string,
  color: string,
  requiredMessage: string,
  lengthMessage: string,
  colorMessage: string,
  duplicateMessage: string,
) {
  const db = await getDatabase();
  const trimmedName = name.trim();
  const trimmedColor = color.trim();

  if (!trimmedName) {
    throw new Error(requiredMessage);
  }
  if (trimmedName.length > 120) {
    throw new Error(lengthMessage);
  }
  if (!isHexColor(trimmedColor)) {
    throw new Error(colorMessage);
  }
  if (await findActiveByName(db, tableName, trimmedName)) {
    throw new Error(duplicateMessage);
  }

  const row: TagRow = {
    id: createId(),
    name: trimmedName,
    color: trimmedColor,
    archivedAt: null,
  };
  await db.runAsync(
    `INSERT INTO ${tableName} (id, name, color, archivedAt) VALUES (?, ?, ?, NULL)`,
    row.id,
    row.name,
    row.color,
  );
  return mapTagRow(row);
}

async function createWorkout(workout: CreateWorkoutRequest): Promise<WorkoutResponse> {
  const db = await getDatabase();
  const notes = (workout.notes ?? '').trim();
  const tagIds = distinctIds(workout.tags?.map((tag) => tag.id) ?? []);

  if (notes.length > 2000) {
    throw new Error('Workout notes must be 2000 characters or fewer.');
  }
  if (tagIds.length === 0) {
    throw new Error('Workout focus is required.');
  }
  if (!workout.exercises || workout.exercises.length === 0) {
    throw new Error('Workout must contain at least one exercise.');
  }
  if (tagIds.some((id) => !id)) {
    throw new Error('Workout focus id is required.');
  }

  const focuses = await getActiveTagsByIds(db, 'workout_focuses', tagIds);
  if (focuses.length !== tagIds.length) {
    throw new Error('One or more workout focus values were not found.');
  }

  const exerciseIds = distinctIds(workout.exercises.map((exercise) => exercise.exerciseId));
  const activeExercises = await getActiveExercisesByIds(db, exerciseIds);
  if (activeExercises.length !== exerciseIds.length) {
    throw new Error('One or more exercises were not found.');
  }
  const activeExercisesById = new Map(activeExercises.map((exercise) => [exercise.id, exercise]));

  const markerIds = distinctIds(workout.exercises.flatMap((exercise) =>
    exercise.tags?.map((tag) => tag.id) ?? [],
  ));
  if (markerIds.some((id) => !id)) {
    throw new Error('Exercise marker id is required.');
  }
  const markers = await getActiveTagsByIds(db, 'exercise_markers', markerIds);
  if (markers.length !== markerIds.length) {
    throw new Error('One or more exercise markers were not found.');
  }

  for (const exercise of workout.exercises) {
    const activeExercise = activeExercisesById.get(exercise.exerciseId);
    if (!activeExercise) {
      throw new Error(`Unknown exercise id: ${exercise.exerciseId}.`);
    }

    const validationMessage = validateWorkoutSets(
      activeExercise.name,
      activeExercise.setType,
      exercise.sets,
    );
    if (validationMessage) {
      throw new Error(validationMessage);
    }
  }

  const completedAt = workout.completedAt ?? new Date().toISOString();
  const startedAt = workout.startedAt ?? completedAt;
  const workoutId = createId();

  return runInTransaction(db, async () => {
    await db.runAsync(
      'INSERT INTO workouts (id, notes, startedAt, completedAt) VALUES (?, ?, ?, ?)',
      workoutId,
      notes,
      startedAt,
      completedAt,
    );

    for (const tagId of tagIds) {
      await db.runAsync(
        'INSERT INTO workout_workout_focuses (workoutId, workoutFocusId) VALUES (?, ?)',
        workoutId,
        tagId,
      );
    }

    for (let exerciseIndex = 0; exerciseIndex < workout.exercises.length; exerciseIndex += 1) {
      const exercise = workout.exercises[exerciseIndex];
      const activeExercise = activeExercisesById.get(exercise.exerciseId)!;
      const workoutExerciseId = createId();
      await db.runAsync(
        'INSERT INTO workout_exercises (id, workoutId, exerciseId, setType, sortOrder) VALUES (?, ?, ?, ?, ?)',
        workoutExerciseId,
        workoutId,
        exercise.exerciseId,
        activeExercise.setType,
        exerciseIndex + 1,
      );

      const selectedMarkerIds = distinctIds(exercise.tags?.map((tag) => tag.id) ?? []);
      for (const markerId of selectedMarkerIds) {
        await db.runAsync(
          'INSERT INTO workout_exercise_exercise_markers (workoutExerciseId, exerciseMarkerId) VALUES (?, ?)',
          workoutExerciseId,
          markerId,
        );
      }

      for (let setIndex = 0; setIndex < exercise.sets.length; setIndex += 1) {
        const set = exercise.sets[setIndex];
        await insertWorkoutSet(db, workoutExerciseId, setIndex + 1, set);
      }
    }

    return mapWorkoutById(db, workoutId);
  });
}

async function getRecentWorkouts(count = 10): Promise<WorkoutResponse[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<WorkoutRow>(
    'SELECT id, notes, startedAt, completedAt FROM workouts ORDER BY completedAt DESC LIMIT ?',
    count,
  );
  return Promise.all(rows.map((row) => mapWorkout(db, row)));
}

async function getWorkoutTagWorkouts(workoutTagId: string): Promise<WorkoutResponse[]> {
  const db = await getDatabase();
  const focus = await getActiveTagById(db, 'workout_focuses', workoutTagId);
  if (!focus) {
    throw new Error('Workout focus was not found.');
  }

  const rows = await db.getAllAsync<WorkoutRow>(
    `SELECT workouts.id, workouts.notes, workouts.startedAt, workouts.completedAt
     FROM workouts
     INNER JOIN workout_workout_focuses ON workout_workout_focuses.workoutId = workouts.id
     WHERE workout_workout_focuses.workoutFocusId = ?
     ORDER BY workouts.completedAt DESC`,
    workoutTagId,
  );
  return Promise.all(rows.map((row) => mapWorkout(db, row)));
}

async function getExerciseTagExercises(exerciseTagId: string): Promise<ExerciseResponse[]> {
  const db = await getDatabase();
  const marker = await getActiveTagById(db, 'exercise_markers', exerciseTagId);
  if (!marker) {
    throw new Error('Exercise marker was not found.');
  }

  const rows = await db.getAllAsync<ExerciseRow>(
    `SELECT DISTINCT exercises.id, exercises.name, exercises.setType, exercises.createdAt, exercises.archivedAt
     FROM workout_exercise_exercise_markers
     INNER JOIN workout_exercises ON workout_exercises.id = workout_exercise_exercise_markers.workoutExerciseId
     INNER JOIN exercises ON exercises.id = workout_exercises.exerciseId
     WHERE workout_exercise_exercise_markers.exerciseMarkerId = ?
       AND exercises.archivedAt IS NULL
     ORDER BY exercises.name`,
    exerciseTagId,
  );
  return rows.map(mapExerciseRow);
}

async function deleteWorkout(workoutId: string): Promise<void> {
  const db = await getDatabase();
  const result = await db.runAsync('DELETE FROM workouts WHERE id = ?', workoutId);
  if (result.changes === 0) {
    throw new Error('Workout was not found.');
  }
}

async function deleteExercise(exerciseId: string): Promise<void> {
  await archiveRow('exercises', exerciseId, 'Exercise was not found.');
}

async function deleteWorkoutTag(workoutTagId: string): Promise<void> {
  await archiveRow('workout_focuses', workoutTagId, 'Workout focus was not found.');
}

async function deleteExerciseTag(exerciseTagId: string): Promise<void> {
  await archiveRow('exercise_markers', exerciseTagId, 'Exercise marker was not found.');
}

async function archiveRow(
  tableName: 'exercises' | 'workout_focuses' | 'exercise_markers',
  id: string,
  notFoundMessage: string,
) {
  const db = await getDatabase();
  const result = await db.runAsync(
    `UPDATE ${tableName} SET archivedAt = ? WHERE id = ? AND archivedAt IS NULL`,
    new Date().toISOString(),
    id,
  );
  if (result.changes === 0) {
    throw new Error(notFoundMessage);
  }
}

async function getExerciseRecords(
  exerciseId: string,
  exerciseMarkerId?: string,
): Promise<ExerciseRecordsResponse> {
  const db = await getDatabase();
  const exercise = await getExerciseById(db, exerciseId);
  if (!exercise) {
    throw new Error('Exercise was not found.');
  }
  if (exerciseMarkerId && !await getActiveTagById(db, 'exercise_markers', exerciseMarkerId)) {
    throw new Error('Exercise marker was not found.');
  }

  const rows = await db.getAllAsync<WorkoutExerciseRow & { completedAt: string }>(
    `SELECT workout_exercises.id,
            workout_exercises.exerciseId,
            exercises.name AS exerciseName,
            workout_exercises.setType,
            workout_exercises.sortOrder,
            workouts.completedAt
     FROM workout_exercises
     INNER JOIN workouts ON workouts.id = workout_exercises.workoutId
     LEFT JOIN exercises ON exercises.id = workout_exercises.exerciseId
     WHERE workout_exercises.exerciseId = ?
     ORDER BY workouts.completedAt DESC`,
    exerciseId,
  );

  const records: ExerciseRecordResponse[] = [];
  for (const row of rows) {
    if (exerciseMarkerId) {
      const hasMarker = await workoutExerciseHasMarker(db, row.id, exerciseMarkerId);
      if (!hasMarker) {
        continue;
      }
    }
    records.push(await mapExerciseRecord(db, row.id));
  }

  return {
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    records,
  };
}

async function updateExerciseRecord(
  exerciseRecordId: string,
  update: UpdateExerciseRecordRequest,
): Promise<ExerciseRecordResponse> {
  const db = await getDatabase();
  const existing = await findWorkoutExercise(db, exerciseRecordId);
  if (!existing) {
    throw new Error('Exercise record was not found.');
  }

  const validationMessage = validateWorkoutSets('exercise record', existing.setType, update.sets);
  if (validationMessage) {
    throw new Error(validationMessage);
  }

  return runInTransaction(db, async () => {
    await db.runAsync('DELETE FROM workout_sets WHERE workoutExerciseId = ?', exerciseRecordId);
    for (let index = 0; index < update.sets.length; index += 1) {
      await insertWorkoutSet(db, exerciseRecordId, index + 1, update.sets[index]);
    }
    return mapExerciseRecord(db, exerciseRecordId);
  });
}

async function deleteExerciseRecord(exerciseRecordId: string): Promise<void> {
  const db = await getDatabase();
  const record = await db.getFirstAsync<{ workoutId: string; sortOrder: number }>(
    'SELECT workoutId, sortOrder FROM workout_exercises WHERE id = ?',
    exerciseRecordId,
  );
  if (!record) {
    throw new Error('Exercise record was not found.');
  }

  await runInTransaction(db, async () => {
    const count = await db.getFirstAsync<CountRow>(
      'SELECT COUNT(*) AS count FROM workout_exercises WHERE workoutId = ?',
      record.workoutId,
    );

    if ((count?.count ?? 0) <= 1) {
      await db.runAsync('DELETE FROM workouts WHERE id = ?', record.workoutId);
      return;
    }

    await db.runAsync('DELETE FROM workout_exercises WHERE id = ?', exerciseRecordId);
    const remaining = await db.getAllAsync<{ id: string }>(
      'SELECT id FROM workout_exercises WHERE workoutId = ? ORDER BY sortOrder',
      record.workoutId,
    );
    for (let index = 0; index < remaining.length; index += 1) {
      await db.runAsync(
        'UPDATE workout_exercises SET sortOrder = ? WHERE id = ?',
        index + 1,
        remaining[index].id,
      );
    }
  });
}

async function getWorkoutTemplates(): Promise<WorkoutTemplateResponse[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<WorkoutTemplateRow>(
    'SELECT id, name, createdAt FROM workout_templates ORDER BY name',
  );
  return Promise.all(rows.map((row) => mapWorkoutTemplate(db, row)));
}

async function createWorkoutTemplate(
  name: string,
  tagIds: string[],
  exercises: { exerciseId: string; setCount: number }[],
): Promise<WorkoutTemplateResponse> {
  const db = await getDatabase();
  const trimmedName = validateTemplateInput(name, tagIds, exercises, false);
  if (await findTemplateByName(db, trimmedName)) {
    throw new Error('A workout template with this name already exists.');
  }

  const distinctTagIds = distinctIds(tagIds);
  const focuses = await getActiveTagsByIds(db, 'workout_focuses', distinctTagIds);
  if (focuses.length !== distinctTagIds.length) {
    throw new Error('One or more workout focus values were not found.');
  }

  const distinctExerciseIds = distinctIds(exercises.map((exercise) => exercise.exerciseId));
  const activeExercises = await getActiveExercisesByIds(db, distinctExerciseIds);
  if (activeExercises.length !== distinctExerciseIds.length) {
    throw new Error('One or more exercises were not found.');
  }

  const templateId = createId();
  return runInTransaction(db, async () => {
    await db.runAsync(
      'INSERT INTO workout_templates (id, name, createdAt) VALUES (?, ?, ?)',
      templateId,
      trimmedName,
      new Date().toISOString(),
    );
    await replaceTemplateRelations(db, templateId, distinctTagIds, exercises);
    return mapWorkoutTemplateById(db, templateId);
  });
}

async function updateWorkoutTemplate(
  workoutTemplateId: string,
  name: string,
  tagIds: string[],
  exercises: { exerciseId: string; setCount: number }[],
): Promise<WorkoutTemplateResponse> {
  const db = await getDatabase();
  const trimmedName = validateTemplateInput(name, tagIds, exercises, true);
  const existing = await getTemplateRowById(db, workoutTemplateId);
  if (!existing) {
    throw new Error('Workout template was not found.');
  }

  const matching = await findTemplateByName(db, trimmedName);
  if (matching && matching.id !== workoutTemplateId) {
    throw new Error('A workout template with this name already exists.');
  }

  const distinctTagIds = distinctIds(tagIds);
  const focuses = await getActiveTagsByIds(db, 'workout_focuses', distinctTagIds);
  if (focuses.length !== distinctTagIds.length) {
    throw new Error('One or more workout focuses were not found.');
  }

  const distinctExerciseIds = distinctIds(exercises.map((exercise) => exercise.exerciseId));
  const activeExercises = await getActiveExercisesByIds(db, distinctExerciseIds);
  if (activeExercises.length !== distinctExerciseIds.length) {
    throw new Error('One or more exercises were not found.');
  }

  return runInTransaction(db, async () => {
    await db.runAsync('UPDATE workout_templates SET name = ? WHERE id = ?', trimmedName, workoutTemplateId);
    await db.runAsync(
      'DELETE FROM workout_template_workout_focuses WHERE workoutTemplateId = ?',
      workoutTemplateId,
    );
    await db.runAsync(
      'DELETE FROM workout_template_exercises WHERE workoutTemplateId = ?',
      workoutTemplateId,
    );
    await replaceTemplateRelations(db, workoutTemplateId, distinctTagIds, exercises);
    return mapWorkoutTemplateById(db, workoutTemplateId);
  });
}

async function deleteWorkoutTemplate(workoutTemplateId: string): Promise<void> {
  const db = await getDatabase();
  const result = await db.runAsync('DELETE FROM workout_templates WHERE id = ?', workoutTemplateId);
  if (result.changes === 0) {
    throw new Error('Workout template was not found.');
  }
}

async function replaceTemplateRelations(
  db: SQLiteDatabase,
  templateId: string,
  tagIds: string[],
  exercises: { exerciseId: string; setCount: number }[],
) {
  for (const tagId of tagIds) {
    await db.runAsync(
      'INSERT INTO workout_template_workout_focuses (workoutTemplateId, workoutFocusId) VALUES (?, ?)',
      templateId,
      tagId,
    );
  }

  for (let index = 0; index < exercises.length; index += 1) {
    const exercise = exercises[index];
    await db.runAsync(
      `INSERT INTO workout_template_exercises
       (id, workoutTemplateId, exerciseId, sortOrder, setCount)
       VALUES (?, ?, ?, ?, ?)`,
      createId(),
      templateId,
      exercise.exerciseId,
      index + 1,
      exercise.setCount,
    );
  }
}

function validateTemplateInput(
  name: string,
  tagIds: string[],
  exercises: { exerciseId: string; setCount: number }[],
  requireFocus: boolean,
) {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error('Template name is required.');
  }
  if (trimmedName.length > 120) {
    throw new Error('Template name must be 120 characters or fewer.');
  }
  if (requireFocus && tagIds.length === 0) {
    throw new Error('Workout template focus is required.');
  }
  if (!exercises || exercises.length === 0) {
    throw new Error('Template must contain at least one exercise.');
  }
  if (exercises.some((exercise) => !exercise.exerciseId)) {
    throw new Error('Exercise id is required.');
  }
  if (exercises.some((exercise) => exercise.setCount < 1 || exercise.setCount > maxWorkoutSetCount)) {
    throw new Error(`Template exercise set count must be between 1 and ${maxWorkoutSetCount}.`);
  }
  if (tagIds.some((id) => !id)) {
    throw new Error('Workout focus id is required.');
  }

  return trimmedName;
}

async function mapWorkoutById(db: SQLiteDatabase, workoutId: string) {
  const row = await db.getFirstAsync<WorkoutRow>(
    'SELECT id, notes, startedAt, completedAt FROM workouts WHERE id = ?',
    workoutId,
  );
  if (!row) {
    throw new Error('Workout was not found.');
  }

  return mapWorkout(db, row);
}

async function mapWorkout(db: SQLiteDatabase, workout: WorkoutRow): Promise<WorkoutResponse> {
  const tags = await db.getAllAsync<TagRow>(
    `SELECT workout_focuses.id, workout_focuses.name, workout_focuses.color, workout_focuses.archivedAt
     FROM workout_workout_focuses
     INNER JOIN workout_focuses ON workout_focuses.id = workout_workout_focuses.workoutFocusId
     WHERE workout_workout_focuses.workoutId = ?
     ORDER BY workout_focuses.name`,
    workout.id,
  );
  const exercises = await db.getAllAsync<WorkoutExerciseRow>(
    `SELECT workout_exercises.id,
            workout_exercises.exerciseId,
            exercises.name AS exerciseName,
            workout_exercises.setType,
            workout_exercises.sortOrder
     FROM workout_exercises
     LEFT JOIN exercises ON exercises.id = workout_exercises.exerciseId
     WHERE workout_exercises.workoutId = ?
     ORDER BY workout_exercises.sortOrder`,
    workout.id,
  );

  return {
    id: workout.id,
    tags: tags.map(mapTagRow),
    notes: workout.notes,
    startedAt: workout.startedAt,
    completedAt: workout.completedAt,
    exercises: await Promise.all(exercises.map((exercise) => mapWorkoutExercise(db, exercise))),
  };
}

async function mapWorkoutExercise(
  db: SQLiteDatabase,
  exercise: WorkoutExerciseRow,
): Promise<WorkoutExerciseResponse> {
  const sets = await db.getAllAsync<WorkoutSetRow>(
    `SELECT setNumber, reps, weight, durationSeconds, distanceMeters
     FROM workout_sets
     WHERE workoutExerciseId = ?
     ORDER BY setNumber`,
    exercise.id,
  );
  const tags = await db.getAllAsync<TagRow>(
    `SELECT exercise_markers.id, exercise_markers.name, exercise_markers.color, exercise_markers.archivedAt
     FROM workout_exercise_exercise_markers
     INNER JOIN exercise_markers ON exercise_markers.id = workout_exercise_exercise_markers.exerciseMarkerId
     WHERE workout_exercise_exercise_markers.workoutExerciseId = ?
     ORDER BY exercise_markers.name`,
    exercise.id,
  );

  return {
    id: exercise.id,
    exerciseId: exercise.exerciseId,
    exerciseName: exercise.exerciseName ?? 'Unknown exercise',
    setType: exercise.setType,
    sets: sets.map(mapWorkoutSetRow),
    tags: tags.map(mapTagRow),
  };
}

async function mapExerciseRecord(db: SQLiteDatabase, workoutExerciseId: string): Promise<ExerciseRecordResponse> {
  const row = await db.getFirstAsync<WorkoutExerciseRow & { workoutId: string; completedAt: string }>(
    `SELECT workout_exercises.id,
            workout_exercises.workoutId,
            workout_exercises.exerciseId,
            exercises.name AS exerciseName,
            workout_exercises.setType,
            workout_exercises.sortOrder,
            workouts.completedAt
     FROM workout_exercises
     INNER JOIN workouts ON workouts.id = workout_exercises.workoutId
     LEFT JOIN exercises ON exercises.id = workout_exercises.exerciseId
     WHERE workout_exercises.id = ?`,
    workoutExerciseId,
  );
  if (!row) {
    throw new Error('Exercise record was not found.');
  }

  const sets = await db.getAllAsync<WorkoutSetRow>(
    `SELECT setNumber, reps, weight, durationSeconds, distanceMeters
     FROM workout_sets
     WHERE workoutExerciseId = ?
     ORDER BY setNumber`,
    workoutExerciseId,
  );
  const tags = await db.getAllAsync<TagRow>(
    `SELECT exercise_markers.id, exercise_markers.name, exercise_markers.color, exercise_markers.archivedAt
     FROM workout_exercise_exercise_markers
     INNER JOIN exercise_markers ON exercise_markers.id = workout_exercise_exercise_markers.exerciseMarkerId
     WHERE workout_exercise_exercise_markers.workoutExerciseId = ?
     ORDER BY exercise_markers.name`,
    workoutExerciseId,
  );
  const mappedSets = sets.map(mapWorkoutSetRow);

  return {
    id: row.id,
    workoutId: row.workoutId,
    completedAt: row.completedAt,
    setType: row.setType,
    setCount: mappedSets.length,
    totalReps: mappedSets.reduce((sum, set) => sum + (set.reps ?? 0), 0),
    maxWeight: Math.max(0, ...mappedSets.map((set) => set.weight ?? 0)),
    totalVolume: mappedSets.reduce((sum, set) => sum + (set.reps ?? 0) * (set.weight ?? 0), 0),
    sets: mappedSets,
    tags: tags.map(mapTagRow),
  };
}

async function mapWorkoutTemplateById(db: SQLiteDatabase, templateId: string) {
  const row = await getTemplateRowById(db, templateId);
  if (!row) {
    throw new Error('Workout template was not found.');
  }
  return mapWorkoutTemplate(db, row);
}

async function mapWorkoutTemplate(
  db: SQLiteDatabase,
  template: WorkoutTemplateRow,
): Promise<WorkoutTemplateResponse> {
  const tags = await db.getAllAsync<TagRow>(
    `SELECT workout_focuses.id, workout_focuses.name, workout_focuses.color, workout_focuses.archivedAt
     FROM workout_template_workout_focuses
     INNER JOIN workout_focuses ON workout_focuses.id = workout_template_workout_focuses.workoutFocusId
     WHERE workout_template_workout_focuses.workoutTemplateId = ?
     ORDER BY workout_focuses.name`,
    template.id,
  );
  const exercises = await db.getAllAsync<WorkoutTemplateExerciseRow>(
    `SELECT workout_template_exercises.exerciseId,
            exercises.name AS exerciseName,
            exercises.setType AS setType,
            workout_template_exercises.setCount,
            workout_template_exercises.sortOrder
     FROM workout_template_exercises
     LEFT JOIN exercises ON exercises.id = workout_template_exercises.exerciseId
     WHERE workout_template_exercises.workoutTemplateId = ?
     ORDER BY workout_template_exercises.sortOrder`,
    template.id,
  );

  return {
    id: template.id,
    name: template.name,
    createdAt: template.createdAt,
    tags: tags.map(mapTagRow),
    exercises: exercises.map((exercise) => ({
      exercise: {
        id: exercise.exerciseId,
        name: exercise.exerciseName ?? 'Unknown exercise',
        setType: exercise.setType ?? 'Strength',
      },
      setCount: exercise.setCount,
    })),
  };
}

async function insertWorkoutSet(
  db: SQLiteDatabase,
  workoutExerciseId: string,
  setNumber: number,
  set: CreateWorkoutRequest['exercises'][number]['sets'][number],
) {
  await db.runAsync(
    `INSERT INTO workout_sets
     (id, workoutExerciseId, setNumber, reps, weight, durationSeconds, distanceMeters)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    createId(),
    workoutExerciseId,
    setNumber,
    set.reps ?? null,
    set.weight ?? null,
    set.durationSeconds ?? null,
    set.distanceMeters ?? null,
  );
}

async function getActiveExercisesByIds(db: SQLiteDatabase, exerciseIds: string[]) {
  if (exerciseIds.length === 0) {
    return [];
  }
  return db.getAllAsync<ExerciseRow>(
    `SELECT id, name, setType, createdAt, archivedAt
     FROM exercises
     WHERE archivedAt IS NULL AND id IN (${placeholders(exerciseIds)})`,
    ...exerciseIds,
  );
}

async function getActiveTagsByIds(
  db: SQLiteDatabase,
  tableName: 'workout_focuses' | 'exercise_markers',
  tagIds: string[],
) {
  if (tagIds.length === 0) {
    return [];
  }
  return db.getAllAsync<TagRow>(
    `SELECT id, name, color, archivedAt
     FROM ${tableName}
     WHERE archivedAt IS NULL AND id IN (${placeholders(tagIds)})`,
    ...tagIds,
  );
}

async function getActiveTagById(
  db: SQLiteDatabase,
  tableName: 'workout_focuses' | 'exercise_markers',
  tagId: string,
) {
  return db.getFirstAsync<TagRow>(
    `SELECT id, name, color, archivedAt FROM ${tableName} WHERE id = ? AND archivedAt IS NULL`,
    tagId,
  );
}

async function getExerciseById(db: SQLiteDatabase, exerciseId: string) {
  return db.getFirstAsync<ExerciseRow>(
    'SELECT id, name, setType, createdAt, archivedAt FROM exercises WHERE id = ?',
    exerciseId,
  );
}

async function findWorkoutExercise(db: SQLiteDatabase, workoutExerciseId: string) {
  return db.getFirstAsync<WorkoutExerciseRow>(
    `SELECT workout_exercises.id,
            workout_exercises.exerciseId,
            exercises.name AS exerciseName,
            workout_exercises.setType,
            workout_exercises.sortOrder
     FROM workout_exercises
     LEFT JOIN exercises ON exercises.id = workout_exercises.exerciseId
     WHERE workout_exercises.id = ?`,
    workoutExerciseId,
  );
}

async function workoutExerciseHasMarker(
  db: SQLiteDatabase,
  workoutExerciseId: string,
  exerciseMarkerId: string,
) {
  const row = await db.getFirstAsync<CountRow>(
    `SELECT COUNT(*) AS count
     FROM workout_exercise_exercise_markers
     WHERE workoutExerciseId = ? AND exerciseMarkerId = ?`,
    workoutExerciseId,
    exerciseMarkerId,
  );
  return (row?.count ?? 0) > 0;
}

async function findActiveByName(
  db: SQLiteDatabase,
  tableName: 'exercises' | 'workout_focuses' | 'exercise_markers',
  name: string,
) {
  const row = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM ${tableName} WHERE archivedAt IS NULL AND lower(name) = lower(?) LIMIT 1`,
    name,
  );
  return row ?? null;
}

async function findTemplateByName(db: SQLiteDatabase, name: string) {
  return db.getFirstAsync<WorkoutTemplateRow>(
    'SELECT id, name, createdAt FROM workout_templates WHERE lower(name) = lower(?) LIMIT 1',
    name,
  );
}

async function getTemplateRowById(db: SQLiteDatabase, templateId: string) {
  return db.getFirstAsync<WorkoutTemplateRow>(
    'SELECT id, name, createdAt FROM workout_templates WHERE id = ?',
    templateId,
  );
}

function validateWorkoutSets(
  exerciseName: string,
  setType: ExerciseSetType,
  sets: CreateWorkoutRequest['exercises'][number]['sets'] | null | undefined,
) {
  if (!sets || sets.length === 0) {
    return 'Each exercise must contain at least one set.';
  }
  if (sets.length > maxWorkoutSetCount) {
    return `Each exercise can contain at most ${maxWorkoutSetCount} sets.`;
  }

  for (const set of sets) {
    const setError = validateWorkoutSet(exerciseName, setType, set);
    if (setError) {
      return setError;
    }
  }

  return null;
}

function validateWorkoutSet(
  exerciseName: string,
  setType: ExerciseSetType,
  set: CreateWorkoutRequest['exercises'][number]['sets'][number],
) {
  switch (setType) {
    case 'Strength':
      return validateStrengthSet(exerciseName, set);
    case 'Duration':
      return validateDurationSet(exerciseName, set);
    case 'RepsOnly':
      return validateRepsOnlySet(exerciseName, set);
    case 'Distance':
      return validateDistanceSet(exerciseName, set);
    case 'DistanceDuration':
      return validateDistanceDurationSet(exerciseName, set);
    default:
      return 'Exercise set type is invalid.';
  }
}

function validateStrengthSet(
  exerciseName: string,
  set: CreateWorkoutRequest['exercises'][number]['sets'][number],
) {
  if (!hasValue(set.reps) || !hasValue(set.weight)) {
    return `Complete reps and weight for ${exerciseName}.`;
  }
  if (set.reps! <= 0) {
    return `Reps must be a positive whole number for ${exerciseName}.`;
  }
  if (set.weight! < 0) {
    return `Weight must be zero or more for ${exerciseName}.`;
  }
  if (hasValue(set.durationSeconds) || hasValue(set.distanceMeters)) {
    return `Strength sets for ${exerciseName} can only include reps and weight.`;
  }
  return null;
}

function validateRepsOnlySet(
  exerciseName: string,
  set: CreateWorkoutRequest['exercises'][number]['sets'][number],
) {
  if (!hasValue(set.reps)) {
    return `Complete reps for ${exerciseName}.`;
  }
  if (set.reps! <= 0) {
    return `Reps must be a positive whole number for ${exerciseName}.`;
  }
  if (hasValue(set.weight) || hasValue(set.durationSeconds) || hasValue(set.distanceMeters)) {
    return `Reps only sets for ${exerciseName} can only include reps.`;
  }
  return null;
}

function validateDurationSet(
  exerciseName: string,
  set: CreateWorkoutRequest['exercises'][number]['sets'][number],
) {
  if (!hasValue(set.durationSeconds)) {
    return `Complete time for ${exerciseName}.`;
  }
  if (set.durationSeconds! <= 0) {
    return `Time must be positive for ${exerciseName}.`;
  }
  if (hasValue(set.reps) || hasValue(set.weight) || hasValue(set.distanceMeters)) {
    return `Duration sets for ${exerciseName} can only include time.`;
  }
  return null;
}

function validateDistanceSet(
  exerciseName: string,
  set: CreateWorkoutRequest['exercises'][number]['sets'][number],
) {
  if (!hasValue(set.distanceMeters)) {
    return `Complete distance for ${exerciseName}.`;
  }
  if (set.distanceMeters! <= 0) {
    return `Distance must be positive for ${exerciseName}.`;
  }
  if (hasValue(set.reps) || hasValue(set.weight) || hasValue(set.durationSeconds)) {
    return `Distance sets for ${exerciseName} can only include distance.`;
  }
  return null;
}

function validateDistanceDurationSet(
  exerciseName: string,
  set: CreateWorkoutRequest['exercises'][number]['sets'][number],
) {
  if (!hasValue(set.distanceMeters) || !hasValue(set.durationSeconds)) {
    return `Complete distance and time for ${exerciseName}.`;
  }
  if (set.distanceMeters! <= 0) {
    return `Distance must be positive for ${exerciseName}.`;
  }
  if (set.durationSeconds! <= 0) {
    return `Time must be positive for ${exerciseName}.`;
  }
  if (hasValue(set.reps) || hasValue(set.weight)) {
    return `Distance and time sets for ${exerciseName} can only include distance and time.`;
  }
  return null;
}

function hasValue(value: number | null | undefined) {
  return value !== null && value !== undefined;
}

function mapExerciseRow(row: ExerciseRow): ExerciseResponse {
  return {
    id: row.id,
    name: row.name,
    setType: row.setType,
  };
}

function mapTagRow(row: TagRow): WorkoutTagResponse {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
  };
}

function mapWorkoutSetRow(row: WorkoutSetRow): WorkoutSetResponse {
  return {
    setNumber: row.setNumber,
    reps: row.reps,
    weight: row.weight,
    durationSeconds: row.durationSeconds,
    distanceMeters: row.distanceMeters,
  };
}

function normalizeSetType(value: string | null | undefined): ExerciseSetType | null {
  return exerciseSetTypes.includes(value as ExerciseSetType) ? value as ExerciseSetType : null;
}

function isHexColor(color: string) {
  return /^#[0-9a-fA-F]{6}$/.test(color);
}

function distinctIds(ids: string[]) {
  return Array.from(new Set(ids));
}

function placeholders(values: unknown[]) {
  return values.map(() => '?').join(', ');
}

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

const starterExercises: { name: string; setType: ExerciseSetType }[] = [
  { name: 'Bench Press', setType: 'Strength' },
  { name: 'Squat', setType: 'Strength' },
  { name: 'Deadlift', setType: 'Strength' },
  { name: 'Shoulder Press', setType: 'Strength' },
  { name: 'Lat Pulldown', setType: 'Strength' },
  { name: 'Barbell Row', setType: 'Strength' },
  { name: 'Plank', setType: 'Duration' },
  { name: 'Pullup', setType: 'RepsOnly' },
  { name: 'Run', setType: 'DistanceDuration' },
  { name: 'Cooper test', setType: 'Distance' },
];

const starterWorkoutFocuses = [
  { name: 'UpperBody', color: '#215F9A' },
  { name: 'LowerBody', color: '#214E3A' },
  { name: 'Legs', color: '#D56A3A' },
  { name: 'Pushing', color: '#B4462E' },
  { name: 'Pulling', color: '#8E44AD' },
];

const starterExerciseMarkers = [
  { name: 'Easy', color: '#214E3A' },
  { name: 'Hard', color: '#B4462E' },
  { name: 'Injured', color: '#8E44AD' },
];
