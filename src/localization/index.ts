import { en, TranslationTable } from './en';
import { fi } from './fi';

export type SupportedLocale = 'en' | 'fi';
export type LanguagePreference = 'device' | SupportedLocale;
type Leaf = string | { readonly [key: string]: Leaf };
type Parameters = Record<string, string | number>;

const tables: Record<SupportedLocale, TranslationTable> = { en, fi };

function detectLocale(): SupportedLocale {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase().startsWith('fi') ? 'fi' : 'en';
  } catch {
    return 'en';
  }
}

let languagePreference: LanguagePreference = 'device';
export let locale: SupportedLocale = detectLocale();

export function getLanguagePreference() {
  return languagePreference;
}

export function setLanguagePreference(preference: LanguagePreference) {
  languagePreference = preference;
  locale = preference === 'device' ? detectLocale() : preference;
}

export function t(path: string, parameters: Parameters = {}): string {
  const value = path.split('.').reduce<Leaf | undefined>((current, segment) =>
    typeof current === 'object' ? current[segment] : undefined, tables[locale]);
  const fallback = path.split('.').reduce<Leaf | undefined>((current, segment) =>
    typeof current === 'object' ? current[segment] : undefined, en);
  const template = typeof value === 'string' ? value : typeof fallback === 'string' ? fallback : path;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(parameters[key] ?? `{${key}}`));
}

export function formatDate(value: Date, options?: Intl.DateTimeFormatOptions) {
  return value.toLocaleDateString(locale, options);
}
