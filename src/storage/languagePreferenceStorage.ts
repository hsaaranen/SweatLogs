import * as FileSystem from 'expo-file-system/legacy';
import { LanguagePreference } from '../localization';

const preferenceFileUri = FileSystem.documentDirectory
  ? `${FileSystem.documentDirectory}language-preference.json`
  : null;

export async function loadLanguagePreference(): Promise<LanguagePreference> {
  if (!preferenceFileUri) return 'device';
  const file = await FileSystem.getInfoAsync(preferenceFileUri);
  if (!file.exists) return 'device';
  try {
    const value: unknown = JSON.parse(await FileSystem.readAsStringAsync(preferenceFileUri));
    return value === 'en' || value === 'fi' || value === 'device' ? value : 'device';
  } catch {
    return 'device';
  }
}

export async function saveLanguagePreference(preference: LanguagePreference) {
  if (!preferenceFileUri) return;
  await FileSystem.writeAsStringAsync(preferenceFileUri, JSON.stringify(preference));
}
