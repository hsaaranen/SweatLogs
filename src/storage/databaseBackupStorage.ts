import { File, Paths } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { supportedSchemaVersion } from '../data/databaseMigrations';
import { localGymLogsStore } from '../data/localGymLogsStore';

export async function exportDatabaseBackup() {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('File sharing is not available on this device.');
  }

  const data = await localGymLogsStore.exportDatabase();
  const date = new Date().toISOString().slice(0, 10);
  const backupFile = new File(
    Paths.cache,
    `sweatlogs-backup-schema-v${supportedSchemaVersion}-${date}.db`,
  );
  backupFile.create({ overwrite: true, intermediates: true });
  backupFile.write(data);

  await Sharing.shareAsync(backupFile.uri, {
    dialogTitle: 'Export SweatLogs backup',
    mimeType: 'application/vnd.sqlite3',
    UTI: 'public.database',
  });
}

/** Copies a selected backup into app storage before importing it for Expo Go compatibility. */
export async function pickAndImportDatabaseBackup() {
  const selection = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (selection.canceled) {
    return false;
  }

  const cachedBackup = new File(selection.assets[0].uri);
  let backupBytes: Uint8Array;
  try {
    backupBytes = await cachedBackup.bytes();
  } catch (error) {
    throw new Error(`Could not read the selected backup from app cache. ${getErrorMessage(error)}`);
  }

  await localGymLogsStore.importDatabase(backupBytes);
  return true;
}

/** Converts unknown native failures into a useful diagnostic message. */
function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
