import { Link } from "react-router-dom";
import { useEffect } from "react";
import { ShoppingBag, FileText, Share2, Mail, ExternalLink } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

// 터치 타겟 최소 48px, 모바일 safe-area 반영
const cardClass = "flex items-center gap-4 w-full min-h-[56px] rounded-xl border-2 border-border bg-card p-4 text-left transition-all duration-200 hover:border-primary hover:bg-primary/10 hover:scale-[1.02] active:scale-[0.99] [touch-action:manipulation]";

function LinkCard({ item }) {
  const isExternal = item.external || item.href.startsWith("http") || item.href.startsWith("mailto:");
  const isGo = item.isGo || item.href.startsWith("/go/");
  const isInternal = !isExternal && !isGo;

  if (isInternal) {
    return (
      <Link to={item.href} className={cardClass}>
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
  // /go/xxx 또는 외부: <a>로 이동 (/go는 Vercel에서 API로 rewrite됨)
  return (
    <a
      href={item.href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className={cardClass}
    >
      <span className="text-3xl w-12 h-12 flex items-center justify-center rounded-lg bg-muted shrink-0">
        {item.thumb}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground">{item.label}</p>
      </div>
      <ExternalLink className="w-5 h-5 text-muted-foreground shrink-0" />
    </a>
  );
}

export default function Links() {
  const { t } = useLanguage();
  const sectionIcons = { shopping: ShoppingBag, content: FileText, sns: Share2, contact: Mail };

  const LINK_SECTIONS = [
    {
      id: "shopping",
      title: t("links.shopping"),
      items: [
        { label: t("links.amazonRec"), href: "/go/amazon-pick", thumb: "🛒", isGo: true },
        { label: t("links.shein"), href: "/go/shein-dress", thumb: "👗", isGo: true },
        { label: t("links.viewMoreProducts"), href: "/links#shopping", thumb: "✨" },
      ],
    },
    {
      id: "content",
      title: t("links.content"),
      items: [
        { label: t("links.marketInsights"), href: "/landing", thumb: "📊" },
        { label: t("links.blog"), href: "/links#blog", thumb: "📝" },
      ],
    },
    {
      id: "sns",
      title: t("links.sns"),
      items: [
        { label: "Instagram", href: "https://www.instagram.com/yuaimarketop", thumb: "📷", external: true },
        { label: "Threads", href: "https://www.threads.net/@yuaimarketop", thumb: "🧵", external: true },
        { label: "Facebook", href: "https://www.facebook.com/yuaimarketop", thumb: "👍", external: true },
      ],
    },
    {
      id: "contact",
      title: t("links.contact"),
      items: [
        { label: t("links.emailContact"), href: "mailto:hyantonio81@gmail.com", thumb: "✉️", external: true },
      ],
    },
  ];

  useEffect(() => {
    document.title = t("links.pageTitle");
    // 픽셀/GA4: 링크 허브 뷰 이벤트 발송
    if (window.fbq) window.fbq('track', 'PageView');
    if (window.gtag) window.gtag('event', 'page_view', { page_path: '/links', page_title: t("links.pageTitle") });
  }, [t]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">YUAI Marketop</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("links.subtitle")}</p>
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
                    <LinkCard key={i} item={item} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <footer className="mt-10 sm:mt-12 pt-4 sm:pt-6 border-t border-border text-center text-xs text-muted-foreground pb-[env(safe-area-inset-bottom)]">
          <a href="mailto:hyantonio81@gmail.com" className="hover:text-foreground transition-colors">hyantonio81@gmail.com</a>
          {" · "}
          <Link to="/landing" className="hover:text-foreground transition-colors">{t("links.home")}</Link>
        </footer>
      </div>
    </div>
  );
}
