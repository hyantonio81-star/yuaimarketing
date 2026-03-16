import { Link } from "react-router-dom";

/**
 * 모듈 진입 카드. subtitle + 선택적 KPI 배지.
 * @param {string} title - 카드 제목
 * @param {string} subtitle - 한 줄 설명
 * @param {string} to - 이동 경로
 * @param {string} colorClass - 좌측 테두리 등 (예: border-l-4 border-l-pillar1)
 * @param {{ value: string|number, label?: string }} [kpi] - 선택적 KPI (예: 리드 수, D-day)
 */
export default function ModuleCard({ title, subtitle, to = "#", colorClass = "", kpi }) {
  return (
    <Link
      to={to}
      className={`block rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md ${colorClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1 truncate">{subtitle}</p>
        </div>
        {kpi != null && (
          <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
            {typeof kpi === "object" && kpi !== null && "label" in kpi
              ? `${kpi.label}: ${kpi.value != null ? String(kpi.value) : "—"}`
              : String(kpi != null ? kpi : "—")}
          </span>
        )}
      </div>
    </Link>
  );
}
