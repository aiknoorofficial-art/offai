import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Code, Shield, MessageCircle, Wallet, BanknoteIcon, Rocket, Globe, Layout } from "lucide-react";
import { useEffect, useState } from "react";

// Update this version and changelog when releasing updates
const CURRENT_VERSION = "1.3.0";
const CHANGELOG = [
  {
    version: "1.3.0",
    date: "January 2026",
    title: "🌐 Website Builder Coming Soon!",
    features: [
      {
        icon: Layout,
        title: "🔧 Website Maker",
        description: "Build stunning websites with drag-and-drop simplicity — no coding required!",
        comingSoon: true,
      },
      {
        icon: Globe,
        title: "🚀 Website Publisher",
        description: "Publish your websites instantly to the web with one click deployment!",
        comingSoon: true,
      },
      {
        icon: Sparkles,
        title: "AI-Powered Design",
        description: "Let AI help you create beautiful layouts and suggest design improvements",
        comingSoon: true,
      },
    ],
  },
  {
    version: "1.2.0",
    date: "January 2026",
    title: "🚀 HUGE UPDATE COMING SOON!",
    features: [
      {
        icon: Rocket,
        title: "💰 Pakistan Payments Integration",
        description: "Send & receive funds easily via Easypaisa, JazzCash, and all Pakistani banks!",
      },
      {
        icon: Wallet,
        title: "Instant Transfers",
        description: "Quick and secure money transfers directly through our platform",
      },
      {
        icon: BanknoteIcon,
        title: "All Banks Supported",
        description: "Support for all major Pakistani banks including HBL, UBL, MCB, Allied Bank & more",
      },
      {
        icon: Shield,
        title: "🌍 Registered in 80+ Countries",
        description: "Officially registered with FBR (Pakistan), USA, and 80+ countries worldwide for secure global transactions",
      },
    ],
  },
  {
    version: "1.1.0",
    date: "January 2026",
    title: "💬 AI Chat Launched",
    features: [
      {
        icon: MessageCircle,
        title: "AI Chat Assistant",
        description: "Get instant answers to your questions with our new AI chat",
      },
      {
        icon: Sparkles,
        title: "Real-time Responses",
        description: "Watch AI responses stream in real-time as you chat",
      },
    ],
  },
  {
    version: "1.0.0",
    date: "January 2026",
    title: "🚀 Initial Launch",
    features: [
      {
        icon: Zap,
        title: "AI Code Generation",
        description: "Generate code in any language with powerful AI",
      },
      {
        icon: Code,
        title: "Multi-Language Support",
        description: "Support for Python, JavaScript, TypeScript, and more",
      },
      {
        icon: Shield,
        title: "Secure Authentication",
        description: "Sign up and sign in to save your work",
      },
      {
        icon: Sparkles,
        title: "Real-time Streaming",
        description: "Watch your code generate in real-time",
      },
    ],
  },
];

const STORAGE_KEY = "off-ai-last-seen-version";

export const WhatsNewModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const lastSeenVersion = localStorage.getItem(STORAGE_KEY);
    if (lastSeenVersion !== CURRENT_VERSION) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
    setIsOpen(false);
  };

  const latestUpdate = CHANGELOG[0];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md border-neon-cyan/30 bg-card/95 backdrop-blur-sm">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-xl gradient-text-multi">
              What's New in OFF AI
            </DialogTitle>
            <Badge variant="outline" className="border-neon-cyan text-neon-cyan">
              v{latestUpdate.version}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{latestUpdate.date}</p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <h3 className="text-lg font-semibold text-foreground">
            {latestUpdate.title}
          </h3>

          <div className="space-y-3">
            {latestUpdate.features.map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-neon-purple/20 hover:border-neon-purple/40 transition-colors"
              >
                <div className="w-8 h-8 rounded-md bg-gradient-to-br from-neon-cyan/20 to-neon-magenta/20 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-4 h-4 text-neon-cyan" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-foreground">{feature.title}</h4>
                    {'comingSoon' in feature && feature.comingSoon && (
                      <Badge className="bg-neon-magenta/20 text-neon-magenta border-neon-magenta/30 text-xs">
                        Coming Soon
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button onClick={handleClose} className="w-full bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-magenta hover:opacity-90 text-background">
          Got it, let's go!
        </Button>
      </DialogContent>
    </Dialog>
  );
};

// Export version and changelog for use in other components
export { CURRENT_VERSION, CHANGELOG };
