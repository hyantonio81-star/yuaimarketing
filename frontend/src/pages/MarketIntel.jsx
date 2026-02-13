import { MessageCircle, BarChart3, ListOrdered, AlertTriangle, ShoppingBag } from "lucide-react";
import SectionCard from "../components/SectionCard";

const SOURCES = [
  { name: "Reddit API", desc: "실시간 소비자 대화", icon: MessageCircle },
  { name: "Twitter/X API", desc: "브랜드 멘션", icon: MessageCircle },
  { name: "Amazon Reviews", desc: "제품 리뷰", icon: BarChart3 },
  { name: "YouTube Comments", desc: "영상 반응", icon: MessageCircle },
  { name: "App Store / Play Store", desc: "앱 리뷰", icon: BarChart3 },
  { name: "Quora", desc: "Q&A 패턴", icon: MessageCircle },
];

const ANALYSIS = [
  { name: "GPT-4", desc: "감정 분석, 테마 추출" },
  { name: "BERT", desc: "토픽 모델링" },
  { name: "Custom NLP", desc: "니즈 패턴 인식" },
];

export default function MarketIntel() {
  return (
    <div className="p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Pillar 1 — Market Intel
        </h1>
        <p className="text-muted-foreground mt-1">
          소비자 니즈·감정·구매의도 분석 (40%)
        </p>
      </header>

      <SectionCard title="소스 (Data Sources)" className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SOURCES.map(({ name, desc, icon: Icon }) => (
            <div
              key={name}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border"
            >
              <Icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-foreground">{name}</div>
                <div className="text-sm text-muted-foreground">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="분석 기술 (Analysis)" className="mb-6">
        <div className="flex flex-wrap gap-4">
          {ANALYSIS.map(({ name, desc }) => (
            <div
              key={name}
              className="px-4 py-2 rounded-md bg-primary/10 border border-primary/30 text-primary font-mono text-sm"
            >
              <span className="font-semibold">{name}</span>
              <span className="text-muted-foreground ml-2">— {desc}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="결과물 (Outputs)">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ResultBlock
            icon={ListOrdered}
            title="소비자 니즈 Top 10"
            sub="주간"
            color="pillar1"
          />
          <ResultBlock
            icon={AlertTriangle}
            title="불만 포인트 분석"
            sub="이슈별 집계"
            color="accent"
          />
          <ResultBlock
            icon={ShoppingBag}
            title="구매 의도 신호 감지"
            sub="실시간"
            color="primary"
          />
        </div>
      </SectionCard>
    </div>
  );
}

const resultColors = {
  pillar1: "bg-pillar1/20 text-pillar1",
  accent: "bg-accent/20 text-accent",
  primary: "bg-primary/20 text-primary",
};

function ResultBlock({ icon: Icon, title, sub, color }) {
  return (
    <div className="p-4 rounded-lg border border-border bg-muted/30 flex items-start gap-3">
      <div className={`p-2 rounded-md shrink-0 ${resultColors[color] ?? resultColors.primary}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="font-medium text-foreground">{title}</div>
        <div className="text-sm text-muted-foreground">{sub}</div>
      </div>
    </div>
  );
}
