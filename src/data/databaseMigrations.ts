import type { SQLiteDatabase } from 'expo-sqlite';

type DatabaseMigration = (db: SQLiteDatabase) => Promise<void>;

// Array position is the source version: migrations[0] upgrades v0 to v1.
// Add each new migration to the end. The supported schema version is derived
// from the array length, so there is no separate version number to maintain.
const migrations: readonly DatabaseMigration[] = [
  async (db) => {
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
  },
];

export const supportedSchemaVersion = migrations.length;

export async function getDatabaseSchemaVersion(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  return row?.user_version ?? 0;
}

export async function migrateDatabase(db: SQLiteDatabase) {
  const originalVersion = await getDatabaseSchemaVersion(db);

  if (originalVersion > supportedSchemaVersion) {
    throw new Error(
      `This backup uses database schema v${originalVersion}, but this version of SweatLogs supports up to v${supportedSchemaVersion}. Update SweatLogs before importing it.`,
    );
  }

  for (let sourceVersion = originalVersion; sourceVersion < supportedSchemaVersion; sourceVersion += 1) {
    await db.execAsync('BEGIN IMMEDIATE TRANSACTION;');
    try {
      await migrations[sourceVersion](db);
      await db.execAsync(`PRAGMA user_version = ${sourceVersion + 1};`);
      await db.execAsync('COMMIT;');
    } catch (error) {
      await db.execAsync('ROLLBACK;');
      throw error;
    }
  }

  return { fromVersion: originalVersion, toVersion: supportedSchemaVersion };
}

