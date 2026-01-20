import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { User } from "@supabase/supabase-js";
import { Video as VideoIcon, Sparkles, Loader2, Download, Clock, Maximize, Play, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AnimatedSection } from "@/components/AnimatedSection";
import { Progress } from "@/components/ui/progress";

const Video = () => {
  const [user, setUser] = useState<User | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [duration, setDuration] = useState("5");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
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

    return () => {
      subscription.unsubscribe();
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [navigate]);

  const checkVideoStatus = async (taskIdToCheck: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-video-status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ taskId: taskIdToCheck }),
        }
      );

      const data = await response.json();

      if (data.status === "SUCCEEDED" && data.videoUrl) {
        setGeneratedVideo(data.videoUrl);
        setIsGenerating(false);
        setProgress(100);
        setStatusMessage("Video generated successfully!");
        toast.success("Your video is ready!");
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      } else if (data.status === "FAILED") {
        setIsGenerating(false);
        setStatusMessage("");
        toast.error(data.error || "Video generation failed");
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      } else {
        // Still processing
        setProgress(prev => Math.min(prev + 5, 90));
        setStatusMessage(data.message || "Generating your video...");
      }
    } catch (error) {
      console.error("Status check error:", error);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    setGeneratedVideo(null);
    setTaskId(null);
    setProgress(0);
    setStatusMessage("Starting video generation...");

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
        toast.error(data.error || "Failed to generate video");
        setIsGenerating(false);
        setStatusMessage("");
        return;
      }

      if (data.videoUrl) {
        // Video completed immediately
        setGeneratedVideo(data.videoUrl);
        setIsGenerating(false);
        setProgress(100);
        setStatusMessage("Video generated successfully!");
        toast.success("Your video is ready!");
      } else if (data.taskId) {
        // Need to poll for completion
        setTaskId(data.taskId);
        setProgress(10);
        setStatusMessage("Video generation in progress...");
        
        // Start polling every 5 seconds
        pollIntervalRef.current = setInterval(() => {
          checkVideoStatus(data.taskId);
        }, 5000);
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("Failed to generate video. Please try again.");
      setIsGenerating(false);
      setStatusMessage("");
    }
  };

  const handleDownload = async () => {
    if (!generatedVideo) return;
    
    try {
      const response = await fetch(generatedVideo);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `video-${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Video downloaded!");
    } catch (error) {
      // Fallback: open in new tab
      window.open(generatedVideo, "_blank");
    }
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
              Transform your ideas into stunning motion videos. Powered by Runway Gen-3 Alpha.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={100}>
            <div className="bg-card border border-border rounded-xl p-4 sm:p-6 box-glow">
              <Textarea
                placeholder="Describe the video you want to generate... (e.g., 'A cinematic sunset over mountains with birds flying, dramatic lighting, smooth camera pan')"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px] sm:min-h-[150px] bg-background border-border mb-4 resize-none text-sm sm:text-base"
                disabled={isGenerating}
              />
              
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <Label htmlFor="duration" className="text-sm text-muted-foreground mb-2 block">
                    Duration (seconds)
                  </Label>
                  <Select value={duration} onValueChange={setDuration} disabled={isGenerating}>
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
                  <Select value={aspectRatio} onValueChange={setAspectRatio} disabled={isGenerating}>
                    <SelectTrigger id="aspect" className="w-full">
                      <Maximize className="w-4 h-4 mr-2 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                      <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                      <SelectItem value="1:1">1:1 (Square)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isGenerating && (
                <div className="mb-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{statusMessage}</span>
                    <span className="text-primary font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
              
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

          {generatedVideo && (
            <AnimatedSection delay={200} className="mt-8">
              <div className="bg-card border border-border rounded-xl p-4 sm:p-6 box-glow">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Play className="w-5 h-5 text-primary" />
                    Generated Video
                  </h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setGeneratedVideo(null)}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      New Video
                    </Button>
                  </div>
                </div>
                <div className="rounded-lg overflow-hidden bg-background">
                  <video 
                    src={generatedVideo} 
                    controls
                    autoPlay
                    loop
                    className="w-full h-auto"
                  />
                </div>
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
                <p className="text-sm text-muted-foreground">Generate high-definition videos up to 1080p</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Runway Gen-3</h3>
                <p className="text-sm text-muted-foreground">Powered by state-of-the-art AI video models</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">5-10 Seconds</h3>
                <p className="text-sm text-muted-foreground">Generate motion video clips up to 10 seconds</p>
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