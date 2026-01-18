import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { User } from "@supabase/supabase-js";
import { Video as VideoIcon, Sparkles, Loader2 } from "lucide-react";

const Video = () => {
  const [user, setUser] = useState<User | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    // Simulate generation - replace with actual API call
    setTimeout(() => {
      setIsGenerating(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={user} />

      <main className="flex-1 pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <VideoIcon className="w-4 h-4" />
              AI Video Generator
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground text-glow mb-4">
              Generate Videos with AI
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Transform your ideas into stunning videos. Describe what you want and let AI create it for you.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 box-glow">
            <Textarea
              placeholder="Describe the video you want to generate... (e.g., 'A cinematic sunset over mountains with birds flying')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[150px] bg-background border-border mb-4 resize-none"
            />
            
            <div className="flex justify-end">
              <Button 
                variant="hero" 
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Video
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
                <VideoIcon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">HD Quality</h3>
              <p className="text-sm text-muted-foreground">Generate high-definition videos up to 1080p</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">AI Powered</h3>
              <p className="text-sm text-muted-foreground">Advanced AI models for realistic results</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
                <Loader2 className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Fast Generation</h3>
              <p className="text-sm text-muted-foreground">Get your videos in minutes, not hours</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Video;
