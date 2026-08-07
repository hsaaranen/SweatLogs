import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
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

export async function pickAndImportDatabaseBackup() {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: false,
    type: '*/*',
  });

  if (result.canceled) {
    return false;
  }

  const backupFile = new File(result.assets[0].uri);
  await localGymLogsStore.importDatabase(await backupFile.bytes());
  return true;
}
