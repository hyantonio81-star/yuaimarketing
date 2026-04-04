import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { translations, languageCodes } from "../lib/translations.js";

const STORAGE_KEY = "nexus-language";

/** Provider 밖에서는 useContext가 이 값과 같지 않음 → 실제 번역기 사용 보장 */
const LANGUAGE_CONTEXT_UNSET = Symbol("languageContextUnset");

const LanguageContext = createContext(LANGUAGE_CONTEXT_UNSET);

function getNested(obj, path) {
  return path.split(".").reduce((o, k) => (o && o[k] != null ? o[k] : null), obj);
}

/** `{{name}}` 또는 `{name}` 자리에 params 치환 (미지정 시 빈 문자열) */
function interpolate(template, params) {
  if (params == null || typeof template !== "string") return template;
  return template.replace(/\{\{(\w+)\}\}|\{(\w+)\}/g, (_, a, b) => {
    const k = a || b;
    const v = params[k];
    return v != null && v !== "" ? String(v) : "";
  });
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
    (key, params) => {
      if (typeof key !== "string" || !key.trim()) return "";
      let value = getNested(translations[language], key);
      if ((value == null || value === "") && language !== "ko") {
        value = getNested(translations.ko, key);
      }
      if (value == null || value === "") return key;
      if (typeof value === "string") return interpolate(value, params);
      return key;
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
  if (ctx === LANGUAGE_CONTEXT_UNSET) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
