import { StaticPage } from "@/components/StaticPage";
import { Calendar, ArrowRight, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { ARTICLES } from "@/data/articles";
import AdSense from "@/components/AdSense";
import { useEffect } from "react";

const Blog = () => {
  useEffect(() => {
    document.title = "Blog — AI tutorials, earning guides & tool reviews | OFF AI";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", "In-depth articles on AI video, prompt engineering, making money with AI, SEO, and building online courses. Long-form guides written for people doing the work.");
  }, []);

  return (
    <StaticPage title="Blog" subtitle="Long-form guides on AI tools, earning online, and building with modern models">
      <div className="not-prose mt-6 space-y-6">
        <AdSense slot="1111111111" />
        <div className="grid gap-5">
          {ARTICLES.map((post) => (
            <Link key={post.slug} to={`/blog/${post.slug}`} className="block">
              <article className="group p-6 rounded-2xl border border-border bg-card/60 backdrop-blur hover:border-primary/50 transition-all hover:scale-[1.01]">
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full bg-${post.color}/10 text-${post.color} border border-${post.color}/30`}>
                    {post.tag}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {post.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {post.readTime}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
                <p className="text-sm text-muted-foreground mb-3">{post.description}</p>
                <span className="text-sm font-medium text-primary inline-flex items-center gap-1">
                  Read article <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </article>
            </Link>
          ))}
        </div>
        <AdSense slot="2222222222" />
      </div>
    </StaticPage>
  );
};

export default Blog;
