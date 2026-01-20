import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { User } from "@supabase/supabase-js";
import { Video as VideoIcon, Sparkles, Loader2, Download, Clock, Maximize } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AnimatedSection } from "@/components/AnimatedSection";

const Video = () => {
  const [user, setUser] = useState<User | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFrame, setGeneratedFrame] = useState<string | null>(null);
  const [duration, setDuration] = useState("5");
  const [aspectRatio, setAspectRatio] = useState("16:9");
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
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    setGeneratedFrame(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to generate videos");
        navigate("/auth");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-video`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ 
            prompt: prompt.trim(),
            duration: parseInt(duration),
            aspectRatio 
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          toast.error("Rate limit exceeded. Please try again later.");
        } else if (response.status === 402) {
          toast.error("Usage limit reached. Please add credits.");
        } else {
          toast.error(data.error || "Failed to generate video");
        }
        return;
      }

      if (data.frameUrl) {
        setGeneratedFrame(data.frameUrl);
        toast.success("Video frame generated successfully!");
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("Failed to generate video. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedFrame) return;
    
    const link = document.createElement("a");
    link.href = generatedFrame;
    link.download = `video-frame-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Frame downloaded!");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={user} />

      <main className="flex-1 pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <AnimatedSection className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm mb-6">
              <VideoIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              AI Video Generator
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground text-glow mb-4">
              Generate Videos with AI
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto px-4">
              Transform your ideas into stunning video frames. Describe what you want and let AI create it for you.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={100}>
            <div className="bg-card border border-border rounded-xl p-4 sm:p-6 box-glow">
              <Textarea
                placeholder="Describe the video you want to generate... (e.g., 'A cinematic sunset over mountains with birds flying')"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px] sm:min-h-[150px] bg-background border-border mb-4 resize-none text-sm sm:text-base"
              />
              
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <Label htmlFor="duration" className="text-sm text-muted-foreground mb-2 block">
                    Duration (seconds)
                  </Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger id="duration" className="w-full">
                      <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 seconds</SelectItem>
                      <SelectItem value="10">10 seconds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label htmlFor="aspect" className="text-sm text-muted-foreground mb-2 block">
                    Aspect Ratio
                  </Label>
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
                    <SelectTrigger id="aspect" className="w-full">
                      <Maximize className="w-4 h-4 mr-2 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                      <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                      <SelectItem value="1:1">1:1 (Square)</SelectItem>
                      <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  variant="hero" 
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  className="w-full sm:w-auto"
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
          </AnimatedSection>

          {generatedFrame && (
            <AnimatedSection delay={200} className="mt-8">
              <div className="bg-card border border-border rounded-xl p-4 sm:p-6 box-glow">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Generated Video Frame</h3>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Frame
                  </Button>
                </div>
                <div className="rounded-lg overflow-hidden bg-background">
                  <img 
                    src={generatedFrame} 
                    alt="Generated video frame" 
                    className="w-full h-auto"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  🎬 Full video generation with motion coming soon! Currently generating high-quality video frames.
                </p>
              </div>
            </AnimatedSection>
          )}

          <AnimatedSection delay={300}>
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
                  <VideoIcon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">HD Quality</h3>
                <p className="text-sm text-muted-foreground">Generate high-definition frames up to 1080p</p>
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
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Fast Generation</h3>
                <p className="text-sm text-muted-foreground">Get your frames in seconds</p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Video;