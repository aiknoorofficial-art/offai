import { Header } from "@/components/Header";
import { CHANGELOG } from "@/components/WhatsNewModal";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

const Changelog = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-primary text-glow mb-2">
            Changelog
          </h1>
          <p className="text-muted-foreground mb-8">
            See what's new in OFF AI
          </p>

          <div className="space-y-8">
            {CHANGELOG.map((release) => (
              <div
                key={release.version}
                className="border border-border rounded-lg p-6 bg-card"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="outline" className="border-primary text-primary">
                    v{release.version}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {release.date}
                  </span>
                </div>

                <h2 className="text-xl font-semibold text-foreground mb-4">
                  {release.title}
                </h2>

                <div className="space-y-3">
                  {release.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50"
                    >
                      <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <feature.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">
                          {feature.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Changelog;
