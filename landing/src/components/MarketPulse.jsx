import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";

// 시뮬레이션용 시드 — 실제 연동 시 API로 대체
const INITIAL = { index: 94, growth: 12.4, volume: 847 };

function tickValue(prev, minStep = 0.5, maxStep = 2) {
  const step = (Math.random() * (maxStep - minStep) + minStep) * (Math.random() > 0.5 ? 1 : -1);
  return Math.max(50, Math.min(99, Math.round((prev + step) * 10) / 10));
}

export default function MarketPulse() {
  const { t } = useLanguage();
  const [data, setData] = useState({
    index: INITIAL.index,
    growth: INITIAL.growth,
    volume: INITIAL.volume,
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setData((prev) => ({
        index: tickValue(prev.index, 0.3, 1.2),
        growth: tickValue(prev.growth, 0.1, 0.6),
        volume: prev.volume + Math.floor((Math.random() - 0.5) * 20),
      }));
      setTick((n) => n + 1);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="glass-panel rounded-2xl p-5 h-full flex flex-col justify-between min-h-[200px]">
      <div className="flex items-center gap-2 mb-4">
        <span className="relative flex h-2.5 w-2.5">
          <span className="live-dot absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
        </span>
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
          {t("home.marketPulseLabel")}
        </span>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between items-baseline">
          <span className="text-slate-500 text-sm">Index</span>
          <span key={tick} className="text-2xl font-semibold text-white tabular-nums animate-tick">
            {data.index}
          </span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-slate-500 text-sm">Growth %</span>
          <span className="text-lg font-medium text-emerald-400 tabular-nums">+{data.growth}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-slate-500 text-sm">Volume</span>
          <span className="text-slate-300 tabular-nums">{data.volume}K</span>
        </div>
      </div>
    </div>
  );
}
