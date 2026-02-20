import { useLocation } from "react-router-dom";

const PILLARS = {
  "/b2b": { title: "B2B Trade", subtitle: "Pillar 2 (20%)" },
  "/b2c": { title: "B2C Commerce", subtitle: "Pillar 3 (30%)" },
  "/gov": { title: "Gov Tender", subtitle: "Pillar 4 (10%)" },
};

export default function PlaceholderPillar() {
  const { pathname } = useLocation();
  const pillar = PILLARS[pathname] ?? { title: "Pillar", subtitle: "" };

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {pillar.title}
        </h1>
        <p className="text-muted-foreground mt-1">{pillar.subtitle}</p>
      </header>
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        이 모듈은 추후 구현 예정입니다.
      </div>
    </div>
  );
}
