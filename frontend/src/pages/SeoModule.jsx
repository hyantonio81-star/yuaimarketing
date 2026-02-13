import { useState } from "react";
import {
  Search,
  BarChart2,
  Link2,
  Calendar,
  FileText,
  Tags,
  Image,
  Zap,
  Sparkles,
  ImageIcon,
  Megaphone,
} from "lucide-react";
import SectionCard from "../components/SectionCard";
import { api } from "../lib/api";

const TOOLS = [
  { name: "Ahrefs API", desc: "키워드 난이도, 검색량", icon: BarChart2 },
  { name: "SEMrush API", desc: "경쟁사 키워드", icon: Search },
  { name: "Google Search Console", desc: "자체 성과", icon: BarChart2 },
  { name: "Answer The Public", desc: "롱테일 질문", icon: Search },
];

const AUTO_ANALYSIS = [
  { label: "공백 키워드 발견", sub: "경쟁 낮음 + 검색량 높음", icon: Zap },
  { label: "콘텐츠 기회", sub: "상위 노출 가능 주제", icon: FileText },
  { label: "백링크 기회", sub: "링크 가능 사이트", icon: Link2 },
  { label: "계절성 트렌드 예측", sub: "시즌별 트렌드", icon: Calendar },
];

const AI_GENERATION = [
  { label: "SEO 최적화 콘텐츠 아웃라인", icon: FileText },
  { label: "메타 태그 자동 생성", icon: Tags },
  { label: "인포그래픽 주제 제안", icon: Image },
];

export default function SeoModule() {
  return (
    <div className="p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          SEO & Content Module
        </h1>
        <p className="text-muted-foreground mt-1">
          도구 · 자동 분석 · AI 생성
        </p>
      </header>

      <SectionCard title="도구 (Tools)" className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TOOLS.map(({ name, desc, icon: Icon }) => (
            <div
              key={name}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border"
            >
              <Icon className="w-5 h-5 text-pillar3 shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-foreground">{name}</div>
                <div className="text-sm text-muted-foreground">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="자동 분석 (Auto Analysis)" className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {AUTO_ANALYSIS.map(({ label, sub, icon: Icon }) => (
            <div
              key={label}
              className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card"
            >
              <Icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-foreground">{label}</div>
                <div className="text-sm text-muted-foreground">{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="AI 생성 (AI Generation)" className="mb-6">
        <div className="flex flex-wrap gap-4">
          {AI_GENERATION.map(({ label, icon: Icon }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-4 py-3 rounded-lg bg-primary/10 border border-primary/30 text-foreground"
            >
              <Icon className="w-4 h-4 text-primary" />
              <span className="font-medium">{label}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <BlogPostGenerator />
      <SocialCalendarSection />
      <AdVariantsSection />
    </div>
  );
}

function AdVariantsSection() {
  const [product, setProduct] = useState("");
  const [platform, setPlatform] = useState("Google");
  const [variants, setVariants] = useState("10");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const { data } = await api.get("/seo/ad-variants", {
        params: {
          product: product || "제품",
          platform,
          variants: variants || "10",
        },
      });
      setResult(data);
    } catch (e) {
      setError(e.message || "광고 변형 생성 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title="광고 변형 생성 (generate_ad_variants)" className="mb-6">
      <p className="text-sm text-muted-foreground mb-4">
        Angle: pain_point, benefit, social_proof, urgency, curiosity → headline(30자), description(90자), CTA, LP 제안, predicted CTR 기준 정렬
      </p>
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="min-w-[160px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">제품</label>
          <input
            type="text"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            placeholder="제품명"
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="min-w-[100px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">플랫폼</label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="Google">Google</option>
            <option value="Facebook">Facebook</option>
            <option value="LinkedIn">LinkedIn</option>
          </select>
        </div>
        <div className="min-w-[80px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">변형 수</label>
          <input
            type="number"
            value={variants}
            onChange={(e) => setVariants(e.target.value)}
            min={1}
            max={50}
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          <Megaphone className="w-4 h-4" />
          {loading ? "생성 중…" : "광고 변형 생성"}
        </button>
      </div>
      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      {result && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {result.product} · {result.platform} · {result.variants?.length}개 (predicted CTR 내림차순)
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="p-2 font-medium text-muted-foreground">#</th>
                  <th className="p-2 font-medium text-muted-foreground">Angle</th>
                  <th className="p-2 font-medium text-muted-foreground">Headline</th>
                  <th className="p-2 font-medium text-muted-foreground">Description</th>
                  <th className="p-2 font-medium text-muted-foreground">CTA</th>
                  <th className="p-2 font-medium text-muted-foreground">Landing Page</th>
                  <th className="p-2 font-medium text-muted-foreground">Pred. CTR %</th>
                </tr>
              </thead>
              <tbody>
                {result.variants?.map((ad, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="p-2 font-mono">{i + 1}</td>
                    <td className="p-2">{ad.angle}</td>
                    <td className="p-2 max-w-[180px] truncate" title={ad.headline}>{ad.headline}</td>
                    <td className="p-2 max-w-[220px] truncate text-muted-foreground" title={ad.description}>{ad.description}</td>
                    <td className="p-2">{ad.cta}</td>
                    <td className="p-2 text-muted-foreground">{ad.landing_page}</td>
                    <td className="p-2 font-mono text-primary">{ad.predicted_ctr}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function SocialCalendarSection() {
  const [product, setProduct] = useState("");
  const [days, setDays] = useState("90");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const previewRows = 14;

  const handleGenerate = async () => {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const { data } = await api.get("/seo/social-calendar", {
        params: { product: product || "제품", days: days || "90" },
      });
      setResult(data);
    } catch (e) {
      setError(e.message || "캘린더 생성 실패");
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = () => {
    if (!result?.posts?.length) return;
    const headers = ["day", "template", "platform", "text", "hashtags", "image", "schedule", "cta"];
    const rows = result.posts.map((p) => [
      p.day,
      p.template,
      p.platform,
      `"${(p.text || "").replace(/"/g, '""')}"`,
      (p.hashtags || []).join(" "),
      p.image,
      p.schedule,
      p.cta,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `social-calendar-${result.product || "product"}-${result.days}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <SectionCard title="소셜 캘린더 생성 (generate_social_calendar)" className="mb-6">
      <p className="text-sm text-muted-foreground mb-4">
        템플릿 비중: educational 30% · promotional 20% · engagement 25% · ugc_reshare 15% · behind_scenes 10%. 플랫폼별 글·해시태그·스케줄·CTA 생성 후 CSV 출력 가능.
      </p>
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="min-w-[160px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">제품/브랜드</label>
          <input
            type="text"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            placeholder="제품명"
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="min-w-[80px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">일수</label>
          <input
            type="number"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            min={7}
            max={365}
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          <Calendar className="w-4 h-4" />
          {loading ? "생성 중…" : "캘린더 생성"}
        </button>
      </div>
      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-muted-foreground">
              {result.product} · {result.days}일 · 총 {result.posts?.length}개 포스트
            </p>
            <button
              type="button"
              onClick={downloadCsv}
              className="text-sm text-primary hover:underline"
            >
              CSV 다운로드
            </button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="p-2 font-medium text-muted-foreground">Day</th>
                  <th className="p-2 font-medium text-muted-foreground">Template</th>
                  <th className="p-2 font-medium text-muted-foreground">Platform</th>
                  <th className="p-2 font-medium text-muted-foreground">Text</th>
                  <th className="p-2 font-medium text-muted-foreground">Hashtags</th>
                  <th className="p-2 font-medium text-muted-foreground">Schedule</th>
                  <th className="p-2 font-medium text-muted-foreground">CTA</th>
                </tr>
              </thead>
              <tbody>
                {result.posts?.slice(0, previewRows).map((post, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="p-2 font-mono">{post.day}</td>
                    <td className="p-2">{post.template}</td>
                    <td className="p-2">{post.platform}</td>
                    <td className="p-2 max-w-[200px] truncate text-muted-foreground" title={post.text}>{post.text}</td>
                    <td className="p-2 text-muted-foreground">{(post.hashtags || []).join(" ")}</td>
                    <td className="p-2 text-muted-foreground">{post.schedule}</td>
                    <td className="p-2">{post.cta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result.posts?.length > previewRows && (
            <p className="text-xs text-muted-foreground">
              상위 {previewRows}건만 표시. 전체는 CSV 다운로드로 확인하세요.
            </p>
          )}
        </div>
      )}
    </SectionCard>
  );
}

function BlogPostGenerator() {
  const [keyword, setKeyword] = useState("");
  const [wordCount, setWordCount] = useState("1500");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const { data } = await api.get("/seo/generate-blog-post", {
        params: {
          keyword: keyword || "키워드",
          word_count: wordCount || "1500",
        },
      });
      setResult(data);
    } catch (e) {
      setError(e.message || "블로그 포스트 생성 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title="AI 블로그 포스트 생성 (generate_blog_post)">
      <p className="text-sm text-muted-foreground mb-4">
        Step 1: 아웃라인 생성 → Step 2: 섹션별 작성 → Step 3: SEO 최적화 → Step 4: 미디어 제안
      </p>
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="min-w-[180px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">타겟 키워드</label>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            placeholder="예: B2B 마케팅 전략"
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="min-w-[100px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">목표 단어 수</label>
          <input
            type="number"
            value={wordCount}
            onChange={(e) => setWordCount(e.target.value)}
            min={500}
            max={5000}
            step={500}
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          {loading ? "생성 중…" : "블로그 포스트 생성"}
        </button>
      </div>
      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      {result && (
        <div className="rounded-lg border border-border bg-muted/20 p-5 space-y-5 text-sm">
          <div className="border-b border-border pb-3">
            <h3 className="text-lg font-bold text-foreground">{result.title}</h3>
            <p className="text-muted-foreground mt-1">{result.meta_description}</p>
            <p className="text-xs text-muted-foreground mt-2">
              단어 수: {result.word_count} · 발행 예정: {result.publish_date}
            </p>
          </div>

          {result.outline?.length > 0 && (
            <div>
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-pillar3" />
                아웃라인
              </h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {result.outline.map((o, i) => (
                  <li key={i}>
                    <span className="text-foreground">{o.heading}</span> — {o.summary}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4 className="font-semibold text-foreground mb-2">콘텐츠 미리보기</h4>
            <div
              className="prose prose-invert prose-sm max-w-none text-muted-foreground line-clamp-6"
              dangerouslySetInnerHTML={{
                __html: result.content?.slice(0, 1200) + (result.content?.length > 1200 ? "…" : "") || "",
              }}
            />
          </div>

          {result.images?.length > 0 && (
            <div>
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-pillar3" />
                미디어 (Featured Image)
              </h4>
              <div className="flex flex-wrap gap-3">
                {result.images.map((img, i) => (
                  <a
                    key={i}
                    href={img.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg border border-border overflow-hidden w-48 h-28 bg-muted"
                  >
                    <img
                      src={img.url}
                      alt={img.alt}
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {result.infographic_suggestions?.length > 0 && (
            <div>
              <h4 className="font-semibold text-foreground mb-2">데이터 시각화 제안</h4>
              <ul className="list-disc list-inside text-muted-foreground">
                {result.infographic_suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}
