import * as FileSystem from 'expo-file-system/legacy';
import { LanguagePreference } from '../localization';

const preferenceFileUri = FileSystem.documentDirectory
  ? `${FileSystem.documentDirectory}language-preference.json`
  : null;

export async function loadLanguagePreference(): Promise<LanguagePreference> {
  if (!preferenceFileUri) return 'en';
  const file = await FileSystem.getInfoAsync(preferenceFileUri);
  if (!file.exists) return 'en';
  try {
    const value: unknown = JSON.parse(await FileSystem.readAsStringAsync(preferenceFileUri));
    return value === 'fi' ? 'fi' : 'en';
  } catch {
    return 'en';
  }
}

export async function saveLanguagePreference(preference: LanguagePreference) {
  if (!preferenceFileUri) return;
  await FileSystem.writeAsStringAsync(preferenceFileUri, JSON.stringify(preference));
}
