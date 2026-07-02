import { useParams, Link, Navigate } from "react-router-dom";
import { StaticPage } from "@/components/StaticPage";
import { ARTICLES, getArticleBySlug } from "@/data/articles";
import { Calendar, Clock, ArrowLeft, ArrowRight } from "lucide-react";
import AdSense from "@/components/AdSense";
import { useEffect } from "react";

const renderContent = (content: string) => {
  const blocks = content.split(/\n\n+/);
  return blocks.map((block, i) => {
    const trimmed = block.trim();
    if (trimmed.startsWith("## ")) {
      return (
        <h2 key={i} className="text-2xl font-bold mt-8 mb-3 text-foreground">
          {trimmed.slice(3)}
        </h2>
      );
    }
    return (
      <p key={i} className="leading-relaxed text-foreground/85">
        {trimmed}
      </p>
    );
  });
};

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getArticleBySlug(slug) : undefined;

  useEffect(() => {
    if (article) {
      document.title = `${article.title} | OFF AI Blog`;
      const desc = document.querySelector('meta[name="description"]');
      if (desc) desc.setAttribute("content", article.description);
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
      }
      canonical.href = `https://offai.lovable.app/blog/${article.slug}`;
    }
  }, [article]);

  if (!article) return <Navigate to="/blog" replace />;

  const idx = ARTICLES.findIndex((a) => a.slug === article.slug);
  const prev = idx > 0 ? ARTICLES[idx - 1] : null;
  const next = idx < ARTICLES.length - 1 ? ARTICLES[idx + 1] : null;

  const rendered = renderContent(article.content);
  const mid = Math.floor(rendered.length / 2);
  const firstHalf = rendered.slice(0, mid);
  const secondHalf = rendered.slice(mid);

  return (
    <StaticPage title={article.title} subtitle={article.description}>
      <div className="not-prose flex items-center gap-3 text-xs text-muted-foreground mb-6 flex-wrap">
        <span className={`px-2 py-0.5 rounded-full bg-${article.color}/10 text-${article.color} border border-${article.color}/30`}>
          {article.tag}
        </span>
        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {article.date}</span>
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {article.readTime}</span>
      </div>

      <div className="not-prose mb-6">
        <AdSense slot="3333333333" />
      </div>

      <article className="space-y-4">
        {firstHalf}
        <div className="not-prose my-6">
          <AdSense slot="4444444444" />
        </div>
        {secondHalf}
      </article>

      <div className="not-prose mt-10 pt-6 border-t border-border flex items-center justify-between gap-4 flex-wrap">
        {prev ? (
          <Link to={`/blog/${prev.slug}`} className="text-sm text-primary inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="w-4 h-4" /> {prev.title}
          </Link>
        ) : <span />}
        {next && (
          <Link to={`/blog/${next.slug}`} className="text-sm text-primary inline-flex items-center gap-1 hover:underline text-right">
            {next.title} <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div className="not-prose mt-8">
        <Link to="/blog" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to all articles
        </Link>
      </div>
    </StaticPage>
  );
};

export default BlogPost;
