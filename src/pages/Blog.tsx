import { StaticPage } from "@/components/StaticPage";
import { Calendar, ArrowRight } from "lucide-react";

const POSTS = [
  {
    title: "Introducing OFF AI Video Generation",
    excerpt: "Generate cinematic videos in seconds with Runway ML's Gen-3 Alpha Turbo, now integrated into the OFF AI suite.",
    date: "June 1, 2026",
    tag: "Product",
    color: "neon-magenta",
  },
  {
    title: "How We Built the Code Generator",
    excerpt: "A behind-the-scenes look at how we wired Gemini 2.5 Flash into a real-time streaming code assistant.",
    date: "May 18, 2026",
    tag: "Engineering",
    color: "neon-cyan",
  },
  {
    title: "Launching the OFF AI Courses Marketplace",
    excerpt: "Creators can now publish and sell courses directly on the platform — and earn through our referral system.",
    date: "May 2, 2026",
    tag: "Announcement",
    color: "neon-yellow",
  },
  {
    title: "Tips for Better AI Prompts",
    excerpt: "Five practical techniques to get sharper, more reliable results from any large language model.",
    date: "April 14, 2026",
    tag: "Tutorial",
    color: "neon-purple",
  },
];

const Blog = () => (
  <StaticPage title="Blog" subtitle="Updates, tutorials, and stories from the OFF AI team">
    <div className="not-prose grid gap-5 mt-6">
      {POSTS.map((post, i) => (
        <article
          key={i}
          className="group p-6 rounded-2xl border border-border bg-card/60 backdrop-blur hover:border-primary/50 transition-all hover:scale-[1.01] cursor-pointer"
        >
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            <span className={`px-2 py-0.5 rounded-full bg-${post.color}/10 text-${post.color} border border-${post.color}/30`}>
              {post.tag}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {post.date}
            </span>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
            {post.title}
          </h2>
          <p className="text-sm text-muted-foreground mb-3">{post.excerpt}</p>
          <span className="text-sm font-medium text-primary flex items-center gap-1">
            Read more <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </span>
        </article>
      ))}
    </div>
  </StaticPage>
);

export default Blog;
