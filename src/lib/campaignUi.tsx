import {
  MessageCircle,
  Music2,
  Youtube,
  Facebook,
  Globe,
  Twitter,
  Send,
  Instagram,
  Share2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const platformIcon = (key: string, className = "w-5 h-5") => {
  const map: Record<string, typeof Globe> = {
    whatsapp: MessageCircle,
    tiktok: Music2,
    youtube: Youtube,
    facebook: Facebook,
    website: Globe,
    x: Twitter,
    telegram: Send,
    instagram: Instagram,
  };
  const Icon = map[key] ?? Share2;
  return <Icon className={className} />;
};

export const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    pending: "bg-neon-orange/15 text-neon-orange border-neon-orange/40",
    active: "bg-neon-cyan/15 text-neon-cyan border-neon-cyan/40",
    approved: "bg-neon-cyan/15 text-neon-cyan border-neon-cyan/40",
    completed: "bg-neon-purple/15 text-neon-purple border-neon-purple/40",
    rejected: "bg-destructive/15 text-destructive border-destructive/40",
    paused: "bg-muted text-muted-foreground border-border",
  };
  return (
    <Badge variant="outline" className={`capitalize ${styles[status] ?? styles.paused}`}>
      {status}
    </Badge>
  );
};

export const money = (amount: number | string, currency: string) =>
  `${currency === "USD" ? "$" : ""}${Number(amount).toLocaleString()}${
    currency === "USD" ? "" : ` ${currency}`
  }`;
