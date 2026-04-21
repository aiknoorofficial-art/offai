import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Image as ImageIcon, Sparkles, Download, Loader2 } from "lucide-react";

const Thumbnail = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("youtube");
  const [imageUrl, setImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) navigate("/auth");
      }
    );
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) navigate("/auth");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGenerate = async () => {
    const clean = prompt.trim();
    if (clean.length < 3) {
      toast.error("Please enter a longer description");
      return;
    }
    if (/[,.]/.test(clean)) {
      toast.error("Prompt must not contain commas or periods");
      return;
    }

    setIsLoading(true);
    setImageUrl("");
    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-thumbnail",
        { body: { prompt: clean, style } }
      );
      if (error) throw error;
      if (!data?.imageUrl) throw new Error("No image returned");
      setImageUrl(data.imageUrl);
      toast.success("Thumbnail generated!");
    } catch (e: any) {
      const msg = e?.message || "Failed to generate thumbnail";
      if (msg.includes("Rate")) toast.error("Rate limit exceeded. Try again shortly.");
      else if (msg.includes("Credits")) toast.error("Add credits to continue.");
      else toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!imageUrl) return;
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `thumbnail-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Download failed");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-4">
              <ImageIcon className="w-4 h-4" />
              AI Thumbnail Generator
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground text-glow mb-4">
              High Quality Thumbnails
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Describe your thumbnail and get a stunning high-resolution result in seconds
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 mb-8 box-glow space-y-4">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. epic gaming setup with neon lights and a shocked youtuber face"
              className="min-h-[120px] resize-none"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Tip: avoid commas and periods in your prompt
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={style} onValueChange={setStyle} disabled={isLoading}>
                <SelectTrigger className="sm:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">YouTube Style</SelectItem>
                  <SelectItem value="gaming">Gaming Style</SelectItem>
                  <SelectItem value="tech">Tech Style</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={handleGenerate}
                disabled={isLoading || !prompt.trim()}
                variant="glow"
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Thumbnail
                  </>
                )}
              </Button>
            </div>
          </div>

          {imageUrl && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">
                    Your Thumbnail
                  </h2>
                </div>
                <Button onClick={handleDownload} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
              <div className="bg-card border border-border rounded-xl p-2 box-glow">
                <img
                  src={imageUrl}
                  alt="Generated thumbnail"
                  className="w-full h-auto rounded-lg"
                />
              </div>
            </div>
          )}

          {!imageUrl && !isLoading && (
            <div className="text-center py-16 text-muted-foreground">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Your thumbnail will appear here</p>
              <p className="text-sm mt-2">
                Describe a scene title or vibe and pick a style
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Thumbnail;
