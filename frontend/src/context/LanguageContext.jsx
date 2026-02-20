import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { translations, languageCodes } from "../lib/translations.js";

const STORAGE_KEY = "nexus-language";

const LanguageContext = createContext({
  language: "ko",
  setLanguage: () => {},
  t: (key) => key,
  languageCodes,
});

function getNested(obj, path) {
  return path.split(".").reduce((o, k) => (o && o[k] != null ? o[k] : null), obj);
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) || "ko";
      return translations[stored] ? stored : "ko";
    } catch {
      return "ko";
    }
  });

  const setLanguage = useCallback((code) => {
    if (!translations[code]) return;
    setLanguageState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch (_) {}
  }, []);

  const t = useCallback(
    (key) => {
      const value = getNested(translations[language], key);
      return value != null ? value : key;
    },
    [language]
  );

  useEffect(() => {
    const root = document.documentElement;
    if (root) root.setAttribute("lang", language === "es" ? "es" : language === "en" ? "en" : "ko");
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languageCodes }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
