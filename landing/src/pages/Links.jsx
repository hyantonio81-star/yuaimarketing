import { useEffect } from "react";
import Layout from "../components/Layout";
import { SITE_NAME, SUPPORT_EMAIL, INSTAGRAM_URL, THREADS_URL, FACEBOOK_URL } from "../lib/config";
import { useLanguage } from "../context/LanguageContext";
import { useSeoMeta } from "../lib/seo";

function getLinkSections(t) {
  return [
    {
      id: "shopping",
      titleKey: "links.shopping",
      items: [
        { labelKey: "links.tienda", to: "/tienda", external: false },
        { labelKey: "links.amazonPick", to: "/go/amazon-pick", external: false },
        { labelKey: "links.shein", to: "/go/shein", external: false },
        { labelKey: "links.temu", to: "/go/temu", external: false },
      ],
    },
    {
      id: "content",
      titleKey: "links.content",
      items: [
        { labelKey: "links.marketInsight", to: "/blog", external: false },
        { labelKey: "links.blog", to: "/blog", external: false },
        { labelKey: "links.products", to: "/products", external: false },
      ],
    },
    {
      id: "sns",
      titleKey: "links.sns",
      items: [
        { label: "Instagram", to: INSTAGRAM_URL || "#", external: true },
        { label: "Threads", to: THREADS_URL || "#", external: true },
        { label: "Facebook", to: FACEBOOK_URL || "#", external: true },
      ],
    },
    {
      id: "contact",
      titleKey: "links.contact",
      items: [
        { labelKey: "links.contactPage", to: "/contact", external: false },
        { labelKey: "links.email", to: `mailto:${SUPPORT_EMAIL}`, external: true },
      ],
    },
  ];
}

function LinkCard({ label, labelKey, to, external, t }) {
  const isExternal = external || to.startsWith("http") || to.startsWith("mailto:");
  const text = labelKey ? t(labelKey) : label;
  return (
    <a
      href={to}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/50 p-4 hover:border-primary/50 hover:bg-slate-800 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
    >
      <span className="flex-1 font-medium text-white">{text}</span>
      <span className="text-slate-500">→</span>
    </a>
  );
}

export default function Links() {
  const { t } = useLanguage();
  const sections = getLinkSections(t);

  useSeoMeta({
    title: t("nav.allLinks"),
    description: t("links.subtitle"),
    path: "/links",
  });

  useEffect(() => {
    const hash = window.location.hash?.slice(1);
    if (hash) {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-white mb-2 text-center">{SITE_NAME}</h1>
        <p className="text-slate-400 text-center mb-10">{t("links.subtitle")}</p>

        {sections.map((section) => (
          <div key={section.id} id={section.id} className="mb-10 scroll-mt-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
              {t(section.titleKey)}
            </h2>
            <div className="space-y-3">
              {section.items.map((item) => (
                <LinkCard
                  key={item.labelKey || item.label}
                  label={item.label}
                  labelKey={item.labelKey}
                  to={item.to}
                  external={item.external}
                  t={t}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
