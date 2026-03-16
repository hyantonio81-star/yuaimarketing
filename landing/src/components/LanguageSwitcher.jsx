import { useLanguage } from "../context/LanguageContext";

const OPTIONS = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
  { code: "ko", label: "한국어" },
];

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-800/80 p-1">
      {OPTIONS.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
            lang === code
              ? "bg-primary text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-700"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
