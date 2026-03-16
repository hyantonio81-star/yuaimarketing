import { useParams, Link } from "react-router-dom";
import Layout from "../components/Layout";
import { useLanguage } from "../context/LanguageContext";
import { BLOG_POSTS } from "../lib/constants";

export default function BlogPost() {
  const { slug } = useParams();
  const { t } = useLanguage();
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-xl font-bold text-white mb-4">{t("blog.title")}</h1>
          <Link to="/blog" className="text-primary hover:underline">{t("blog.subtitle")}</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <article className="max-w-2xl mx-auto px-4 py-10">
        <Link to="/blog" className="text-slate-500 hover:text-primary text-sm mb-6 inline-block">
          ← {t("blog.title")}
        </Link>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
          <div className="aspect-[2/1] bg-slate-700">
            <img src={post.image} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="p-6">
            <span className="text-xs font-medium text-primary uppercase tracking-wider">
              {t(post.categoryKey)}
            </span>
            <h1 className="text-2xl font-bold text-white mt-1">{t(post.titleKey)}</h1>
            <p className="text-slate-500 text-sm mt-2">{post.date}</p>
            <p className="text-slate-400 mt-4">{t(post.excerptKey)}</p>
            <p className="text-slate-500 text-sm mt-6">
              {t("blog.subtitle")} — Full report coming soon.
            </p>
          </div>
        </div>
      </article>
    </Layout>
  );
}
