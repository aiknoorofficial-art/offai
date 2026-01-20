import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { PromptInput } from "@/components/PromptInput";
import { CodeBlock } from "@/components/CodeBlock";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Terminal, Sparkles } from "lucide-react";

const Generate = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [generatedCode, setGeneratedCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

  const handleGenerate = async (prompt: string, language: string) => {
    setIsLoading(true);
    setGeneratedCode("");

    try {
      // Get user's session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("Please log in to continue");
        navigate("/auth");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ prompt, language }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          toast.error("Rate limit exceeded. Please wait a moment and try again.");
        } else if (response.status === 402) {
          toast.error("Usage limit reached. Please add credits to continue.");
        } else {
          toast.error(errorData.error || "Failed to generate code");
        }
        setIsLoading(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No reader available");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              setGeneratedCode((prev) => prev + content);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      toast.success("Code generated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />

      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-4">
              <Terminal className="w-4 h-4" />
              AI Code Generator
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground text-glow mb-4">
              Generate Code Instantly
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Describe what you want to build and let AI write the code for you.
              Supports multiple programming languages.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 mb-8 box-glow">
            <PromptInput onSubmit={handleGenerate} isLoading={isLoading} />
          </div>

          {generatedCode && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Generated Code</h2>
              </div>
              <CodeBlock code={generatedCode} />
            </div>
          )}

          {!generatedCode && !isLoading && (
            <div className="text-center py-16 text-muted-foreground">
              <Terminal className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Your generated code will appear here</p>
              <p className="text-sm mt-2">Try asking for a function, component, or algorithm</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Generate;
