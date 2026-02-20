import { Link } from "react-router-dom";

export default function PillarCard({ title, subtitle, weight, colorClass, to = "#" }) {

  return (
    <Link
      to={to}
      className={`block rounded-lg border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md ${colorClass}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <span className="text-xs font-mono font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
          {weight}
        </span>
      </div>
    </Link>
  );
}
