import { Link } from "react-router-dom";
import { Zap, Github, Twitter, Mail, Heart, Code2, Video, MessageSquare, Sparkles } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="relative border-t border-border bg-card/50 overflow-hidden">
      {/* Animated gradient glow */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-glow opacity-60" />
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[200px] rounded-full blur-3xl bg-gradient-to-r from-neon-cyan/20 via-neon-magenta/20 to-neon-yellow/20 animate-pulse-glow" />

      <div className="container relative mx-auto px-4 py-10 md:py-12">
        {/* Mobile: compact stacked layout */}
        <div className="md:hidden">
          {/* Brand */}
          <div className="flex flex-col items-center text-center mb-6 animate-fade-in-up">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_20px_hsl(var(--primary)/0.5)] animate-pulse-glow">
                <Zap className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold gradient-text-multi animate-gradient">OFF AI</span>
            </Link>
            <p className="text-xs text-muted-foreground max-w-xs">
              AI-powered tools for developers and creators.
            </p>
          </div>

          {/* Quick action grid */}
          <div className="grid grid-cols-3 gap-2 mb-6 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            <Link to="/generate" className="group flex flex-col items-center gap-1 p-3 rounded-xl border border-border/50 bg-card/40 backdrop-blur hover:border-neon-cyan/50 hover:bg-neon-cyan/5 transition-all active:scale-95">
              <Code2 className="w-5 h-5 text-neon-cyan group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-medium">Code</span>
            </Link>
            <Link to="/video" className="group flex flex-col items-center gap-1 p-3 rounded-xl border border-border/50 bg-card/40 backdrop-blur hover:border-neon-magenta/50 hover:bg-neon-magenta/5 transition-all active:scale-95">
              <Video className="w-5 h-5 text-neon-magenta group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-medium">Video</span>
            </Link>
            <Link to="/chat" className="group flex flex-col items-center gap-1 p-3 rounded-xl border border-border/50 bg-card/40 backdrop-blur hover:border-neon-yellow/50 hover:bg-neon-yellow/5 transition-all active:scale-95">
              <MessageSquare className="w-5 h-5 text-neon-yellow group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-medium">Chat</span>
            </Link>
          </div>

          {/* Mini links */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mb-5 text-xs animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <Link to="/changelog" className="text-muted-foreground hover:text-primary transition-colors story-link">What's New</Link>
            <Link to="/courses" className="text-muted-foreground hover:text-primary transition-colors">Courses</Link>
            <Link to="/referral" className="text-muted-foreground hover:text-primary transition-colors">Referral</Link>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Terms</a>
          </div>

          {/* Socials */}
          <div className="flex items-center justify-center gap-3 mb-5 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
            {[
              { Icon: Github, color: "hover:text-neon-cyan hover:border-neon-cyan/50" },
              { Icon: Twitter, color: "hover:text-neon-magenta hover:border-neon-magenta/50" },
              { Icon: Mail, color: "hover:text-neon-yellow hover:border-neon-yellow/50" },
            ].map(({ Icon, color }, i) => (
              <a
                key={i}
                href="#"
                className={`w-10 h-10 rounded-full border border-border bg-card/60 backdrop-blur flex items-center justify-center text-muted-foreground transition-all duration-300 hover:scale-110 active:scale-95 ${color}`}
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>

          {/* Bottom */}
          <div className="pt-4 border-t border-border/50 flex flex-col items-center gap-1 text-[11px] text-muted-foreground">
            <p className="flex items-center gap-1">
              Made with <Heart className="w-3 h-3 text-destructive animate-pulse fill-destructive" /> for creators
            </p>
            <p>© 2026 OFF AI · All rights reserved</p>
          </div>
        </div>

        {/* Desktop layout */}
        <div className="hidden md:block">
          <div className="grid grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-1 animate-fade-in-up">
              <Link to="/" className="flex items-center gap-2 mb-4 group">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_20px_hsl(var(--primary)/0.5)] group-hover:shadow-[0_0_30px_hsl(var(--primary)/0.8)] transition-all animate-pulse-glow">
                  <Zap className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold gradient-text-multi animate-gradient">OFF AI</span>
              </Link>
              <p className="text-sm text-muted-foreground mb-4">
                AI-powered tools for developers and creators. Generate code, videos, and more.
              </p>
              <div className="flex items-center gap-3">
                {[Github, Twitter, Mail].map((Icon, i) => (
                  <a key={i} href="#" className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 hover:scale-110 transition-all">
                    <Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-neon-cyan" /> Products
              </h3>
              <ul className="space-y-3">
                <li><Link to="/generate" className="text-sm text-muted-foreground hover:text-primary transition-colors story-link">Code Generator</Link></li>
                <li><Link to="/video" className="text-sm text-muted-foreground hover:text-primary transition-colors story-link">Video Generator</Link></li>
                <li><Link to="/chat" className="text-sm text-muted-foreground hover:text-primary transition-colors story-link">AI Chat</Link></li>
              </ul>
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
              <h3 className="font-semibold text-foreground mb-4">Company</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors story-link">About Us</a></li>
                <li><Link to="/changelog" className="text-sm text-muted-foreground hover:text-primary transition-colors story-link">Changelog</Link></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors story-link">Blog</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors story-link">Careers</a></li>
              </ul>
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
              <h3 className="font-semibold text-foreground mb-4">Legal</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors story-link">Privacy Policy</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors story-link">Terms of Service</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors story-link">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">© 2026 OFF AI. All rights reserved.</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              Made with <Heart className="w-4 h-4 text-destructive animate-pulse fill-destructive" /> for developers
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
