import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface StaticPageProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export const StaticPage = ({ title, subtitle, children }: StaticPageProps) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={user} />
      <main className="container mx-auto px-4 pt-24 pb-16 flex-1">
        <div className="max-w-3xl mx-auto animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-bold gradient-text-multi animate-gradient mb-3">
            {title}
          </h1>
          {subtitle && (
            <p className="text-lg text-muted-foreground mb-8">{subtitle}</p>
          )}
          <div className="prose prose-invert max-w-none text-foreground/90 space-y-4 leading-relaxed">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
