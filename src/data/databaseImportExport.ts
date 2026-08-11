import { Paths } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';
import {
  getDatabaseSchemaVersion,
  migrateDatabase,
  supportedSchemaVersion,
} from './databaseMigrations';

type TableRow = { name: string };
type TableInfoRow = {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
};
type ForeignKeyRow = {
  id: number;
  seq: number;
  table: string;
  from: string;
  to: string;
  on_update: string;
  on_delete: string;
  match: string;
};
type IndexListRow = {
  name: string;
  unique: number;
  origin: string;
  partial: number;
};
type IndexInfoRow = { seqno: number; cid: number; name: string | null };
type SchemaObjectRow = { type: string; name: string; tbl_name: string; sql: string };

type DatabaseImportExportDependencies = {
  getDatabase: () => Promise<SQLiteDatabase>;
};

let expectedSchemaPromise: Promise<string> | null = null;

/** Creates database transfer operations without coupling this module to the store's connection state. */
export function createDatabaseImportExport({
  getDatabase,
}: DatabaseImportExportDependencies) {
  /** Serializes the current database into bytes suitable for a backup file. */
  async function exportDatabase() {
    const db = await getDatabase();
    return db.serializeAsync();
  }

  /** Validates, migrates, and atomically replaces the current database with imported bytes. */
  async function importDatabase(serializedDatabase: Uint8Array) {
    const importedDb = await SQLite.deserializeDatabaseAsync(serializedDatabase);

    try {
      await validateDatabaseIntegrity(importedDb);
      await validateSweatLogsIdentity(importedDb);
      await migrateDatabase(importedDb);
      await validateCurrentSchema(importedDb);
      await validateDatabaseIntegrity(importedDb);
      const currentDb = await getDatabase();
      const currentDatabase = await currentDb.serializeAsync();

      try {
        await SQLite.backupDatabaseAsync({
          sourceDatabase: importedDb,
          destDatabase: currentDb,
        });
      } catch (error) {
        const restoreDb = await SQLite.deserializeDatabaseAsync(currentDatabase);
        try {
          await SQLite.backupDatabaseAsync({
            sourceDatabase: restoreDb,
            destDatabase: currentDb,
          });
        } finally {
          await restoreDb.closeAsync();
        }
        throw error;
      }
    } finally {
      await importedDb.closeAsync();
    }
  }

  return { exportDatabase, importDatabase };
}

/** Confirms that SQLite and all foreign-key relationships in an imported database are valid. */
async function validateDatabaseIntegrity(db: SQLiteDatabase) {
  const integrity = await db.getFirstAsync<{ integrity_check: string }>('PRAGMA integrity_check;');
  if (integrity?.integrity_check !== 'ok') {
    throw new Error('The selected file is not a valid SQLite database.');
  }

  const foreignKeyErrors = await db.getAllAsync('PRAGMA foreign_key_check;');
  if (foreignKeyErrors.length > 0) {
    throw new Error('The selected backup contains invalid linked records.');
  }
}

/** Rejects SQLite files that do not identify as a compatible SweatLogs database. */
async function validateSweatLogsIdentity(db: SQLiteDatabase) {
  const tables = await db.getAllAsync<TableRow>(
    "SELECT name FROM sqlite_master WHERE type = 'table';",
  );
  const tableNames = new Set(tables.map((table) => table.name));
  const identityTables = ['app_metadata', 'exercises', 'workouts'];

  if (identityTables.some((table) => !tableNames.has(table))) {
    throw new Error('The selected database is not a SweatLogs backup.');
  }

  const version = await getDatabaseSchemaVersion(db);
  if (!Number.isInteger(version) || version < 0) {
    throw new Error('The selected backup has an invalid database schema version.');
  }
  if (version > supportedSchemaVersion) {
    throw new Error(
      `This backup uses database schema v${version}, but this version of SweatLogs supports up to v${supportedSchemaVersion}. Update SweatLogs before importing it.`,
    );
  }
}

/** Verifies that a database exactly matches the schema expected by the current app version. */
export async function validateCurrentSchema(db: SQLiteDatabase) {
  const version = await getDatabaseSchemaVersion(db);
  if (version !== supportedSchemaVersion) {
    throw new Error(`The backup could not be upgraded to database schema v${supportedSchemaVersion}.`);
  }

  const [actualSchema, expectedSchema] = await Promise.all([
    inspectDatabaseSchema(db),
    getExpectedSchema(),
  ]);
  if (actualSchema !== expectedSchema) {
    throw new Error(
      `The backup schema does not match SweatLogs database schema v${supportedSchemaVersion}.`,
    );
  }
}

/** Returns a cached canonical schema and resets the cache if schema creation fails. */
function getExpectedSchema() {
  if (!expectedSchemaPromise) {
    expectedSchemaPromise = createExpectedSchema().catch((error) => {
      expectedSchemaPromise = null;
      throw error;
    });
  }
  return expectedSchemaPromise;
}

/** Builds a temporary migrated database to derive the canonical schema representation. */
async function createExpectedSchema() {
  const temporaryName = `sweatlogs-schema-${Date.now()}-${Math.random().toString(36).slice(2)}.db`;
  const db = await SQLite.openDatabaseAsync(temporaryName, undefined, Paths.cache.uri);

  try {
    await db.execAsync('PRAGMA foreign_keys = ON;');
    await migrateDatabase(db);
    return await inspectDatabaseSchema(db);
  } finally {
    try {
      await db.closeAsync();
    } finally {
      await SQLite.deleteDatabaseAsync(temporaryName, Paths.cache.uri);
    }
  }
}

/** Converts database tables, constraints, indexes, views, and triggers into a stable string. */
async function inspectDatabaseSchema(db: SQLiteDatabase) {
  const tables = await db.getAllAsync<TableRow>(
    "SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name;",
  );
  const inspectedTables = [];

  for (const { name } of tables) {
    const identifier = quoteSqlIdentifier(name);
    const columns = await db.getAllAsync<TableInfoRow>(`PRAGMA table_info(${identifier});`);
    const foreignKeys = await db.getAllAsync<ForeignKeyRow>(`PRAGMA foreign_key_list(${identifier});`);
    const indexRows = await db.getAllAsync<IndexListRow>(`PRAGMA index_list(${identifier});`);
    const indexes = [];

    for (const index of indexRows.sort((left, right) => left.name.localeCompare(right.name))) {
      const indexColumns = await db.getAllAsync<IndexInfoRow>(
        `PRAGMA index_info(${quoteSqlIdentifier(index.name)});`,
      );
      indexes.push({
        name: index.name,
        unique: index.unique,
        origin: index.origin,
        partial: index.partial,
        columns: indexColumns
          .sort((left, right) => left.seqno - right.seqno)
          .map(({ cid, name: columnName }) => ({ cid, name: columnName })),
      });
    }

    inspectedTables.push({
      name,
      columns: columns
        .sort((left, right) => left.cid - right.cid)
        .map(({ name: columnName, type, notnull, dflt_value, pk }) => ({
          name: columnName,
          type: type.toUpperCase(),
          notnull,
          defaultValue: dflt_value,
          primaryKeyOrder: pk,
        })),
      foreignKeys: foreignKeys
        .sort((left, right) => left.id - right.id || left.seq - right.seq)
        .map(({ id, seq, table, from, to, on_update, on_delete, match }) => ({
          id,
          seq,
          table,
          from,
          to,
          onUpdate: on_update,
          onDelete: on_delete,
          match,
        })),
      indexes,
    });
  }

  const otherObjects = await db.getAllAsync<SchemaObjectRow>(`
    SELECT type, name, tbl_name, sql
    FROM sqlite_schema
    WHERE type IN ('index', 'view', 'trigger')
      AND name NOT LIKE 'sqlite_%'
      AND sql IS NOT NULL
    ORDER BY type, name;
  `);

  return JSON.stringify({
    tables: inspectedTables,
    objects: otherObjects.map(({ type, name, tbl_name, sql }) => ({
      type,
      name,
      table: tbl_name,
      sql: normalizeSql(sql),
    })),
  });
}

/** Quotes an SQLite identifier so schema inspection can safely use discovered names. */
function quoteSqlIdentifier(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

/** Normalizes schema SQL formatting before structural comparison. */
function normalizeSql(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}
