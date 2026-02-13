import {
  Globe,
  DollarSign,
  Package,
  Briefcase,
  FileText,
  Megaphone,
  GitCompare,
  Cpu,
  Lightbulb,
  Bell,
  FileDown,
} from "lucide-react";
import SectionCard from "../components/SectionCard";

const AUTO_TRACKING = [
  { label: "경쟁사 웹사이트 변경", tool: "Visualping", icon: Globe },
  { label: "가격 변동", tool: "Price monitoring bots", icon: DollarSign },
  { label: "신제품 출시", tool: "Product Hunt, Crunchbase", icon: Package },
  { label: "채용 공고", tool: "LinkedIn, Indeed", icon: Briefcase },
  { label: "특허 출원", tool: "USPTO, EPO API", icon: FileText },
  { label: "광고 캠페인", tool: "Facebook Ad Library, Pathmatics", icon: Megaphone },
];

const ALGORITHMS = [
  { name: "변화 감지", desc: "Diff algorithms" },
  { name: "전략 패턴 인식", desc: "ML classifier" },
  { name: "경쟁 우위 기회 자동 탐지", desc: "Opportunity detection" },
];

const ALERTS = [
  { label: "중요 변화 즉시 알림", channels: "Slack / Email", icon: Bell },
  { label: "주간 경쟁사 리포트", format: "PDF", icon: FileDown },
];

export default function CompetitorTracking() {
  return (
    <div className="p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Competitor Tracking
        </h1>
        <p className="text-muted-foreground mt-1">
          자동 추적 · 알고리즘 · 알림
        </p>
      </header>

      <SectionCard title="자동 추적 (Auto Tracking)" className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {AUTO_TRACKING.map(({ label, tool, icon: Icon }) => (
            <div
              key={label}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border"
            >
              <Icon className="w-5 h-5 text-pillar2 shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-foreground">{label}</div>
                <div className="text-sm text-muted-foreground font-mono">{tool}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="알고리즘 (Algorithms)" className="mb-6">
        <div className="flex flex-wrap gap-4">
          {ALGORITHMS.map(({ name, desc }) => (
            <div
              key={name}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-pillar2/10 border border-pillar2/30"
            >
              <Cpu className="w-4 h-4 text-pillar2" />
              <span className="font-medium text-foreground">{name}</span>
              <span className="text-sm text-muted-foreground">— {desc}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="알림 (Alerts)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ALERTS.map(({ label, channels, format, icon: Icon }) => (
            <div
              key={label}
              className="flex items-center gap-4 p-4 rounded-lg border border-border bg-muted/30"
            >
              <div className="p-2 rounded-md bg-accent/20 text-accent">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="font-medium text-foreground">{label}</div>
                <div className="text-sm text-muted-foreground">
                  {channels ?? format}
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
