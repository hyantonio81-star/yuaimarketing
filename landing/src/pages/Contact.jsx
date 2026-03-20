import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import { useLanguage } from "../context/LanguageContext";
import { SUPPORT_EMAIL, API_BASE } from "../lib/config";
import { useSeoMeta } from "../lib/seo";

const INQUIRY_TYPES = [
  { value: "general", labelKey: "contact.inquiryTypeGeneral" },
  { value: "b2b", labelKey: "contact.inquiryTypeB2b" },
  { value: "sourcing", labelKey: "contact.inquiryTypeSourcing" },
  { value: "interest", labelKey: "contact.inquiryTypeInterest" },
  { value: "tienda", labelKey: "contact.inquiryTypeTienda" },
  { value: "carton-dr", labelKey: "contact.inquiryTypeCartonDr" },
];

const VALID_TYPE_VALUES = new Set(INQUIRY_TYPES.map((o) => o.value));

export default function Contact() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
    inquiryType: "",
  });
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  const typeFromUrl = searchParams.get("type");
  useSeoMeta({
    title: t("contact.title"),
    description: t("contact.subtitle"),
    path: "/contact",
  });

  useEffect(() => {
    if (typeFromUrl && VALID_TYPE_VALUES.has(typeFromUrl)) {
      setForm((prev) => (prev.inquiryType ? prev : { ...prev, inquiryType: typeFromUrl }));
    }
  }, [typeFromUrl]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!privacyAgreed) return;
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        inquiryType: form.inquiryType || "general",
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
      };
      const url = API_BASE ? `${API_BASE}/api/landing/contact` : "/api/landing/contact";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text().catch(() => "Error"));
      setSent(true);
      setForm({ name: "", email: "", message: "", inquiryType: "" });
      setPrivacyAgreed(false);
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-slate-600 bg-slate-800/80 px-4 py-2.5 text-white placeholder-slate-500 focus:border-primary focus:outline-none";

  return (
    <Layout>
      <div className="max-w-xl mx-auto px-4 py-10">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 text-center">
          {t("contact.title")}
        </h1>
        <p className="text-slate-400 text-center mb-8">{t("contact.subtitle")}</p>

        {sent ? (
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-6 text-center">
            <p className="text-primary font-medium">{t("contact.success")}</p>
            <p className="text-slate-400 text-sm mt-1">
              {t("contact.successNote")}{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">
                {SUPPORT_EMAIL}
              </a>
            </p>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="mt-4 text-sm text-slate-400 hover:text-white"
            >
              {t("contact.sendAgain")}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="contact-inquiryType" className="block text-sm text-slate-400 mb-1">
                {t("contact.inquiryTypeLabel")}
              </label>
              <select
                id="contact-inquiryType"
                name="inquiryType"
                value={form.inquiryType}
                onChange={handleChange}
                className={`${inputClass} cursor-pointer`}
                aria-describedby={error ? "contact-error" : undefined}
              >
                <option value="">{t("contact.inquiryTypePlaceholder")}</option>
                {INQUIRY_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {t(opt.labelKey)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="contact-name" className="block text-sm text-slate-400 mb-1">
                {t("contact.namePlaceholder")}
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                className={inputClass}
                placeholder={t("contact.namePlaceholder")}
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="block text-sm text-slate-400 mb-1">
                {t("contact.emailPlaceholder")}
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder={t("contact.emailPlaceholder")}
              />
            </div>
            <div>
              <label htmlFor="contact-message" className="block text-sm text-slate-400 mb-1">
                {t("contact.messagePlaceholder")}
              </label>
              <textarea
                id="contact-message"
                name="message"
                value={form.message}
                onChange={handleChange}
                rows={4}
                className={`${inputClass} resize-y`}
                placeholder={t("contact.messagePlaceholder")}
              />
            </div>
            {error && (
              <p id="contact-error" className="text-amber-400 text-sm" role="alert">
                {t("contact.errorGeneric")}{" "}
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="underline hover:text-white"
                >
                  {t("contact.retry")}
                </button>
              </p>
            )}
            <div className="flex items-start gap-3">
              <input
                id="contact-privacy"
                type="checkbox"
                checked={privacyAgreed}
                onChange={(e) => setPrivacyAgreed(e.target.checked)}
                className="mt-1 rounded border-slate-600 bg-slate-800/80 text-primary focus:ring-primary/50 min-h-[20px] min-w-[20px]"
              />
              <label htmlFor="contact-privacy" className="text-sm text-slate-400 cursor-pointer">
                {t("contact.privacyConsent")}{" "}
                <Link to="/privacy" className="text-primary hover:underline">
                  {t("contact.privacyConsentLink")}
                </Link>
                {t("contact.privacyConsentAfter") ?? ""}
              </label>
            </div>
            <button
              type="submit"
              disabled={!privacyAgreed || submitting}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              aria-busy={submitting}
            >
              {submitting ? "…" : t("contact.submit")}
            </button>
          </form>
        )}
      </div>
    </Layout>
  );
}
