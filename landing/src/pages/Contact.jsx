import { useState } from "react";
import Layout from "../components/Layout";
import { useLanguage } from "../context/LanguageContext";
import { SUPPORT_EMAIL } from "../lib/config";

export default function Contact() {
  const { t } = useLanguage();
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Placeholder: 실제 백엔드/이메일 API 연동 시 교체
    setSent(true);
    setForm({ name: "", email: "", message: "" });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

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
              <label htmlFor="contact-name" className="block text-sm text-slate-400 mb-1">
                {t("contact.namePlaceholder")}
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-600 bg-slate-800/80 px-4 py-2.5 text-white placeholder-slate-500 focus:border-primary focus:outline-none"
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
                className="w-full rounded-lg border border-slate-600 bg-slate-800/80 px-4 py-2.5 text-white placeholder-slate-500 focus:border-primary focus:outline-none"
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
                className="w-full rounded-lg border border-slate-600 bg-slate-800/80 px-4 py-2.5 text-white placeholder-slate-500 focus:border-primary focus:outline-none resize-y"
                placeholder={t("contact.messagePlaceholder")}
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              {t("contact.submit")}
            </button>
          </form>
        )}
      </div>
    </Layout>
  );
}
