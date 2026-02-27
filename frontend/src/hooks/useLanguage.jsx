import { createContext, useContext, useState, useCallback } from 'react';
import translations, { LANGUAGES } from '../utils/translations';

const LanguageContext = createContext(null);

const STORAGE_KEY = 'agriLang';

function getSavedLang() {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'en';
  } catch {
    return 'en';
  }
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getSavedLang);

  const setLang = useCallback((code) => {
    const valid = LANGUAGES.find((l) => l.code === code);
    if (!valid) return;
    localStorage.setItem(STORAGE_KEY, code);
    setLangState(code);
    document.documentElement.lang = code;
  }, []);

  /** Translate a key. Falls back to English, then to the key itself. */
  const t = useCallback(
    (key) => {
      const entry = translations[key];
      if (!entry) return key;
      return entry[lang] || entry.en || key;
    },
    [lang],
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
