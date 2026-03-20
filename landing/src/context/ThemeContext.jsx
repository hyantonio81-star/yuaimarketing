import { createContext, useContext, useState, useEffect } from "react";

const STORAGE_KEY = "yuaimarketop-theme";

const ThemeContext = createContext({
  theme: "dark",
  setTheme: () => {},
  effective: "dark",
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("dark");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && ["dark", "light", "system"].includes(saved)) setThemeState(saved);
    } catch (_) {}
  }, []);

  const setTheme = (value) => {
    if (!["dark", "light", "system"].includes(value)) return;
    setThemeState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch (_) {}
  };

  const [effective, setEffective] = useState("dark");
  useEffect(() => {
    const isLight = () => {
      if (theme === "light") return true;
      if (theme === "dark") return false;
      return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches;
    };
    const apply = () => {
      const light = isLight();
      setEffective(light ? "light" : "dark");
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("light", light);
      }
    };
    apply();
    if (theme === "system" && typeof window !== "undefined") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = () => apply();
      mq.addEventListener("change", listener);
      return () => mq.removeEventListener("change", listener);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, effective }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
