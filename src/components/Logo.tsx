import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export const Logo = ({ className }: LogoProps) => {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("block", className)}
      aria-label="OFFTOOL logo"
    >
      <rect width="40" height="40" rx="8" fill="hsl(var(--logo-bg))" />
      <rect x="11" y="14" width="3" height="15" rx="1.5" fill="hsl(var(--logo-text))" />
      <rect x="11" y="20" width="6" height="3" rx="1.5" fill="hsl(var(--logo-text))" />
      <rect x="26" y="14" width="3" height="15" rx="1.5" fill="hsl(var(--logo-text))" />
      <rect x="11" y="11" width="18" height="3" rx="1.5" fill="hsl(var(--logo-red))" />
    </svg>
  );
};
