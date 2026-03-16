import { Link } from "react-router-dom";
import { ShoppingBag, FileText, Share2, Mail, ExternalLink } from "lucide-react";

const LINK_SECTIONS = [
  {
    id: "shopping",
    title: "쇼핑",
    items: [
      { label: "Amazon 추천", href: "/api/go/amazon-pick", thumb: "🛒" },
      { label: "Shein", href: "/api/go/shein-dress", thumb: "👗" },
      { label: "추천 상품 더보기", href: "/links#shopping", thumb: "✨" },
    ],
  },
  {
    id: "content",
    title: "콘텐츠",
    items: [
      { label: "시장 인사이트", href: "/landing", thumb: "📊" },
      { label: "블로그", href: "/links#blog", thumb: "📝" },
    ],
  },
  {
    id: "sns",
    title: "SNS",
    items: [
      { label: "Instagram", href: "https://instagram.com", thumb: "📷", external: true },
      { label: "Threads", href: "https://threads.net", thumb: "🧵", external: true },
      { label: "Facebook", href: "https://facebook.com", thumb: "👍", external: true },
    ],
  },
  {
    id: "contact",
    title: "문의",
    items: [
      { label: "이메일 문의", href: "mailto:hyantonio81@gmail.com", thumb: "✉️", external: true },
    ],
  },
];

function LinkCard({ item, baseUrl }) {
  const isExternal = item.external || item.href.startsWith("http") || item.href.startsWith("mailto:");
  const isApiGo = item.href.startsWith("/api/go/");
  const url = isApiGo ? `${baseUrl}${item.href}` : item.href;
  const isInternal = !isExternal && !isApiGo;

  if (isInternal) {
    return (
      <Link
        to={item.href}
        className="flex items-center gap-4 w-full rounded-xl border-2 border-border bg-card p-4 text-left hover:border-primary hover:bg-primary/10 transition-colors"
      >
        <span className="text-3xl w-12 h-12 flex items-center justify-center rounded-lg bg-muted shrink-0">
          {item.thumb}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground">{item.label}</p>
        </div>
        <ExternalLink className="w-5 h-5 text-muted-foreground shrink-0" />
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={() => { window.location.href = url; }}
      className="flex items-center gap-4 w-full rounded-xl border-2 border-border bg-card p-4 text-left hover:border-primary hover:bg-primary/10 transition-colors"
    >
      <span className="text-3xl w-12 h-12 flex items-center justify-center rounded-lg bg-muted shrink-0">
        {item.thumb}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground">{item.label}</p>
      </div>
      <ExternalLink className="w-5 h-5 text-muted-foreground shrink-0" />
    </button>
  );
}

export default function Links() {
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const sectionIcons = { shopping: ShoppingBag, content: FileText, sns: Share2, contact: Mail };
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">YUAI Marketop</h1>
          <p className="text-sm text-muted-foreground mt-1">맞춤 링크 허브 · 인스타·Threads 바이오용</p>
        </div>
        <div className="space-y-8">
          {LINK_SECTIONS.map((section) => {
            const Icon = sectionIcons[section.id] || FileText;
            return (
              <div key={section.id} id={section.id}>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {section.title}
                </h2>
                <div className="space-y-3">
                  {section.items.map((item, i) => (
                    <LinkCard key={i} item={item} baseUrl={baseUrl} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <footer className="mt-12 pt-6 border-t border-border text-center text-xs text-muted-foreground">
          <a href="mailto:hyantonio81@gmail.com" className="hover:text-foreground">hyantonio81@gmail.com</a>
          {" · "}
          <Link to="/landing" className="hover:text-foreground">홈</Link>
        </footer>
      </div>
    </div>
  );
}
