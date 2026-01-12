import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";
import { Zap, Code, Sparkles, Terminal, ArrowRight } from "lucide-react";

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
    <div className="min-h-screen bg-background">
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
              AI-Powered Code Generation
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="text-foreground text-glow">Generate Code</span>
              <br />
              <span className="gradient-text">With a Prompt</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Transform your ideas into production-ready code instantly. 
              OFF AI understands what you need and writes clean, efficient code for any language.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={user ? "/generate" : "/auth?mode=signup"}>
                <Button variant="hero" size="xl">
                  <Zap className="w-5 h-5 mr-2" />
                  Start Generating
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to={user ? "/generate" : "/auth"}>
                <Button variant="outline" size="xl">
                  {user ? "Open Generator" : "Sign In"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground text-glow mb-4">
              Built for Developers
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Everything you need to accelerate your development workflow
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <FeatureCard
              icon={<Code className="w-8 h-8" />}
              title="Multiple Languages"
              description="Generate code in JavaScript, Python, TypeScript, Rust, Go, and more. Auto-detect or specify your language."
            />
            <FeatureCard
              icon={<Terminal className="w-8 h-8" />}
              title="Clean Output"
              description="Get well-structured, commented code that's ready to use. No more copying from snippets."
            />
            <FeatureCard
              icon={<Sparkles className="w-8 h-8" />}
              title="AI-Powered"
              description="Powered by advanced AI models that understand context and best practices for modern development."
            />
          </div>
        </div>
      </section>

      {/* Code Preview Section */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card border border-border rounded-xl overflow-hidden box-glow">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/50">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <div className="w-3 h-3 rounded-full bg-primary" />
                <div className="w-3 h-3 rounded-full bg-terminal" />
                <span className="ml-4 text-sm font-mono text-muted-foreground">example.ts</span>
              </div>
              <pre className="p-6 overflow-x-auto">
                <code className="font-mono text-sm text-foreground">
{`// Generated by OFF AI
function quickSort<T>(arr: T[]): T[] {
  if (arr.length <= 1) return arr;
  
  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter(x => x < pivot);
  const middle = arr.filter(x => x === pivot);
  const right = arr.filter(x => x > pivot);
  
  return [...quickSort(left), ...middle, ...quickSort(right)];
}

// Usage
const sorted = quickSort([3, 1, 4, 1, 5, 9, 2, 6]);
console.log(sorted); // [1, 1, 2, 3, 4, 5, 6, 9]`}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground text-glow mb-6">
              Ready to Code Faster?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Join developers who are shipping faster with AI-generated code.
            </p>
            <Link to={user ? "/generate" : "/auth?mode=signup"}>
              <Button variant="hero" size="xl">
                <Zap className="w-5 h-5 mr-2" />
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground">OFF AI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 OFF AI. Built for developers.
          </p>
        </div>
      </footer>
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
