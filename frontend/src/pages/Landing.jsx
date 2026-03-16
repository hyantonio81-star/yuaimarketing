import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, ShoppingBag, FileText } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-12 md:py-20">
        <header className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            YUAI Marketop
          </h1>
          <p className="text-lg text-muted-foreground mt-3">
            시장 인사이트와 맞춤 제품을 한곳에서
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            전문가가 큐레이션한 중남미·글로벌 트렌드 상품
          </p>
        </header>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link
            to="/links"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            모든 링크 보기
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/links#shopping"
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-border bg-card px-6 py-3.5 text-base font-semibold text-foreground hover:border-primary hover:bg-primary/10 transition-colors"
          >
            쇼핑하기
          </Link>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="rounded-xl border border-border bg-card p-5 text-center">
            <div className="inline-flex p-2 rounded-lg bg-pillar1/15 text-pillar1 mb-3">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-foreground">시장 인텔</h3>
            <p className="text-sm text-muted-foreground mt-1">트렌드·수입/수출 인사이트</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 text-center">
            <div className="inline-flex p-2 rounded-lg bg-pillar3/15 text-pillar3 mb-3">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-foreground">제품 큐레이션</h3>
            <p className="text-sm text-muted-foreground mt-1">맞춤 쇼핑 링크</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 text-center">
            <div className="inline-flex p-2 rounded-lg bg-primary/15 text-primary mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-foreground">콘텐츠·마케팅</h3>
            <p className="text-sm text-muted-foreground mt-1">블로그·SNS 연동</p>
          </div>
        </section>

        <footer className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <a href="mailto:hyantonio81@gmail.com" className="hover:text-foreground">hyantonio81@gmail.com</a>
          {" · "}
          <Link to="/links" className="hover:text-foreground">링크 허브</Link>
        </footer>
      </div>
    </div>
  );
}
