import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";
import { Zap, Code, Sparkles, Terminal, ArrowRight, Video, MessageSquare, Shield, Globe, Cpu, Users } from "lucide-react";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={user} />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[80px]" />
          <div className="absolute inset-0 scanline opacity-30" />
        </div>

        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-8">
              <Sparkles className="w-4 h-4" />
              The Future of AI Creation
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="text-foreground text-glow">Create Anything</span>
              <br />
              <span className="gradient-text">With AI Power</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              OFF AI is your all-in-one AI platform. Generate code, create videos, chat with AI, and build amazing things—all in one place.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={user ? "/generate" : "/auth?mode=signup"}>
                <Button variant="hero" size="xl">
                  <Zap className="w-5 h-5 mr-2" />
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to={user ? "/chat" : "/auth"}>
                <Button variant="outline" size="xl">
                  {user ? "Open Dashboard" : "Sign In"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-20 px-4 bg-card/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground text-glow mb-4">
              Our AI Products
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Powerful AI tools designed to supercharge your creativity and productivity
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Link to={user ? "/generate" : "/auth"} className="group">
              <div className="bg-card border border-border rounded-xl p-8 hover:border-primary/50 transition-all duration-300 hover:box-glow h-full">
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                  <Code className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-3">Code Generator</h3>
                <p className="text-muted-foreground mb-4">Transform your ideas into production-ready code. Supports JavaScript, Python, TypeScript, Rust, Go, and more.</p>
                <span className="text-primary text-sm font-medium flex items-center gap-2">
                  Try it now <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>

            <Link to={user ? "/video" : "/auth"} className="group">
              <div className="bg-card border border-border rounded-xl p-8 hover:border-primary/50 transition-all duration-300 hover:box-glow h-full">
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                  <Video className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-3">Video Generator</h3>
                <p className="text-muted-foreground mb-4">Create stunning videos from text descriptions. AI-powered video generation for content creators and marketers.</p>
                <span className="text-primary text-sm font-medium flex items-center gap-2">
                  Create video <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>

            <Link to={user ? "/chat" : "/auth"} className="group">
              <div className="bg-card border border-border rounded-xl p-8 hover:border-primary/50 transition-all duration-300 hover:box-glow h-full">
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-3">AI Chat</h3>
                <p className="text-muted-foreground mb-4">Have intelligent conversations with our advanced AI. Get answers, brainstorm ideas, and solve problems together.</p>
                <span className="text-primary text-sm font-medium flex items-center gap-2">
                  Start chatting <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground text-glow mb-4">
              Why Choose OFF AI?
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Built with cutting-edge technology for maximum performance and reliability
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <FeatureCard
              icon={<Cpu className="w-8 h-8" />}
              title="Advanced AI Models"
              description="Powered by state-of-the-art language models trained on billions of parameters for accurate results."
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8" />}
              title="Secure & Private"
              description="Your data is encrypted and never shared. We prioritize your privacy and security above all."
            />
            <FeatureCard
              icon={<Globe className="w-8 h-8" />}
              title="Global Availability"
              description="Access OFF AI from anywhere in the world with our distributed infrastructure and fast response times."
            />
            <FeatureCard
              icon={<Code className="w-8 h-8" />}
              title="Multiple Languages"
              description="Generate code in JavaScript, Python, TypeScript, Rust, Go, and 20+ programming languages."
            />
            <FeatureCard
              icon={<Terminal className="w-8 h-8" />}
              title="Clean Output"
              description="Get well-structured, commented code that's production-ready. No more copying from snippets."
            />
            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title="Growing Community"
              description="Join thousands of developers and creators who trust OFF AI for their daily workflow."
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-card/30">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">10K+</div>
              <p className="text-muted-foreground">Active Users</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">1M+</div>
              <p className="text-muted-foreground">Code Generated</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">50+</div>
              <p className="text-muted-foreground">Languages Supported</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">99.9%</div>
              <p className="text-muted-foreground">Uptime</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground text-glow mb-6">
              Ready to Create with AI?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Join thousands of creators who are building amazing things with OFF AI.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={user ? "/generate" : "/auth?mode=signup"}>
                <Button variant="hero" size="xl">
                  <Zap className="w-5 h-5 mr-2" />
                  Get Started Free
                </Button>
              </Link>
              <Link to="/changelog">
                <Button variant="outline" size="xl">
                  View Changelog
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all duration-300 group hover:box-glow">
    <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
      {icon}
    </div>
    <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

export default Index;
