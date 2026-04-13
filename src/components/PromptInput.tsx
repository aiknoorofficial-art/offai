import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2 } from "lucide-react";

interface PromptInputProps {
  onSubmit: (prompt: string, language: string) => void;
  isLoading: boolean;
}

const languages = [
  { value: "auto", label: "Auto-detect" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "sql", label: "SQL" },
  { value: "html", label: "HTML/CSS" },
];

export const PromptInput = ({ onSubmit, isLoading }: PromptInputProps) => {
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("auto");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onSubmit(prompt, language === "auto" ? "" : language);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <Textarea
          placeholder="Describe the code you want to generate (no commas or special characters)&#10;&#10;Example: Create a React component for a todo list with add delete and toggle functionality"
          value={prompt}
          onChange={(e) => {
            const cleaned = e.target.value.replace(/[^a-zA-Z0-9\s\-?!()'/:\n]/g, "");
            setPrompt(cleaned);
          }}
          className="min-h-[150px] pr-4 text-base border-glow"
          disabled={isLoading}
        />
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-full sm:w-[200px] border-border bg-input">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {languages.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="submit"
          variant="hero"
          size="lg"
          className="flex-1"
          disabled={!prompt.trim() || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Code
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
