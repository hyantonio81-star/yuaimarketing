import { useParams, Link } from "react-router-dom";
import Layout from "../components/Layout";
import { useLanguage } from "../context/LanguageContext";
import { BLOG_POSTS } from "../lib/constants";
import { useSeoMeta } from "../lib/seo";

const DEFAULT_IMG = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=320&fit=crop";

export default function BlogPost() {
  const { slug } = useParams();
  const { t } = useLanguage();
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  useSeoMeta({
    title: post ? t(post.titleKey) : t("blog.postNotFound"),
    description: post ? t(post.excerptKey) : t("blog.postNotFoundDesc"),
    path: post ? `/blog/${post.slug}` : "/blog",
    image: post?.image,
    noIndex: !post,
  });

  if (!post) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-xl font-bold text-white mb-4">{t("blog.postNotFound")}</h1>
          <p className="text-slate-400 text-sm mb-4">{t("blog.postNotFoundDesc")}</p>
          <Link to="/blog" className="text-primary hover:underline">{t("blog.title")}</Link>
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
            <img
              src={post.image}
              alt={t(post.titleKey)}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_IMG; }}
            />
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
