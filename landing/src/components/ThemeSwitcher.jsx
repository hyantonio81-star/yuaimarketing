import { useTheme } from "../context/ThemeContext";

const labels = { dark: "Dark", light: "Light", system: "System" };

export default function ThemeSwitcher() {
  const { theme, setTheme, effective } = useTheme();
  const cycle = () => {
    if (theme === "dark") setTheme("light");
    else if (theme === "light") setTheme("system");
    else setTheme("dark");
  };

  return (
    <button
      type="button"
      onClick={cycle}
      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors transition-transform duration-150 hover:scale-105 active:scale-95"
      title={`Theme: ${labels[theme]} (${effective})`}
      aria-label={`Theme: ${labels[theme]}`}
    >
      {effective === "light" ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}
