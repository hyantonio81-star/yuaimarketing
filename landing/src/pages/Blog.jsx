import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { useLanguage } from "../context/LanguageContext";
import { BLOG_POSTS } from "../lib/constants";

export default function Blog() {
  const { t } = useLanguage();

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 text-center">
          {t("blog.title")}
        </h1>
        <p className="text-slate-400 text-center mb-10">{t("blog.subtitle")}</p>

        <div className="space-y-8">
          {BLOG_POSTS.map((post) => (
            <article
              key={post.id}
              className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden hover:border-primary/50 transition-colors"
            >
              <Link to={`/blog/${post.slug}`} className="block">
                <div className="aspect-[6/3] sm:aspect-[2/1] overflow-hidden bg-slate-700">
                  <img
                    src={post.image}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-5">
                  <span className="text-xs font-medium text-primary uppercase tracking-wider">
                    {t(post.categoryKey)}
                  </span>
                  <h2 className="text-lg font-semibold text-white mt-1">{t(post.titleKey)}</h2>
                  <p className="text-slate-400 text-sm mt-2">{t(post.excerptKey)}</p>
                  <p className="text-slate-500 text-xs mt-3">{post.date}</p>
                  <span className="inline-block mt-2 text-primary text-sm font-medium hover:underline">
                    {t("blog.readMore")} →
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </Layout>
  );
}
