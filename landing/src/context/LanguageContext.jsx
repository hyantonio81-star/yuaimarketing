import { createContext, useContext, useState, useEffect } from "react";
import { defaultLang, t as translate, replaceParams } from "../lib/translations";

const STORAGE_KEY = "yuaimarketop-lang";

const LanguageContext = createContext({
  lang: defaultLang,
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(defaultLang);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && (saved === "es" || saved === "en" || saved === "ko")) setLangState(saved);
    } catch (_) {}
  }, []);

  const setLang = (code) => {
    if (code !== "es" && code !== "en" && code !== "ko") return;
    setLangState(code);
    if (typeof document !== "undefined") document.documentElement.lang = code;
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch (_) {}
  };

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);

  const t = (key, params) => {
    const str = translate(lang, key);
    return params ? replaceParams(str, params) : str;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
