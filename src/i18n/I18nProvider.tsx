import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_LOCALE, LOCALE_CODES, LOCALE_LABELS, messages, type SupportedLocale } from './messages';

const STORAGE_KEY = 'curio.locale.v1';

type TranslationValues = Record<string, string | number>;

interface I18nContextValue {
  locale: SupportedLocale;
  localeCode: string;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: string, values?: TranslationValues) => string;
  formatDateTime: (value: string | number | Date) => string;
  availableLocales: Array<{ value: SupportedLocale; label: string }>;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function interpolate(template: string, values?: TranslationValues) {
  if (!values) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
}

function detectInitialLocale(): SupportedLocale {
  const savedLocale = window.localStorage.getItem(STORAGE_KEY);

  if (savedLocale === 'en' || savedLocale === 'pt-BR') {
    return savedLocale;
  }

  return navigator.language.toLowerCase().startsWith('pt') ? 'pt-BR' : DEFAULT_LOCALE;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => detectInitialLocale());

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => {
    const dictionary = messages[locale];

    return {
      locale,
      localeCode: LOCALE_CODES[locale],
      setLocale: setLocaleState,
      t: (key, values) => interpolate(dictionary[key] ?? messages[DEFAULT_LOCALE][key] ?? key, values),
      formatDateTime: (input) => new Intl.DateTimeFormat(LOCALE_CODES[locale], { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(input)),
      availableLocales: (Object.keys(LOCALE_LABELS) as SupportedLocale[]).map((value) => ({
        value,
        label: LOCALE_LABELS[value],
      })),
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider.');
  }

  return context;
}
