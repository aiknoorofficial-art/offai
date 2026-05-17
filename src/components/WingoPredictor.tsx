import { useEffect, useState } from "react";
import { Dices, TrendingUp } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

const ROUND_SECONDS = 30;

type Prediction = {
  roundIndex: number;
  secondsLeft: number;
  size: "BIG" | "SMALL";
  sizeConfidence: number;
  color: "RED" | "GREEN" | "VIOLET";
  colorConfidence: number;
  digit: number;
  digitConfidence: number;
};

const hash = (n: number) => {
  // xorshift-ish deterministic hash
  let x = (n ^ 0x9e3779b1) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35) >>> 0;
  x = (x ^ (x >>> 16)) >>> 0;
  return x;
};

const predictRound = (roundIndex: number) => {
  const h1 = hash(roundIndex);
  const h2 = hash(roundIndex * 2654435761);
  const h3 = hash(roundIndex ^ 0xdeadbeef);

  const digit = h1 % 10;
  const size: "BIG" | "SMALL" = digit >= 5 ? "BIG" : "SMALL";
  const colorRoll = h2 % 100;
  let color: "RED" | "GREEN" | "VIOLET";
  if (digit === 0 || digit === 5) color = "VIOLET";
  else if (digit % 2 === 0) color = "RED";
  else color = "GREEN";

  return {
    digit,
    size,
    color,
    sizeConfidence: 60 + (h1 % 36), // 60-95
    colorConfidence: 55 + (h2 % 41), // 55-95
    digitConfidence: 25 + (h3 % 35), // 25-59 (digits are harder)
  };
};

const getPrediction = (): Prediction => {
  const now = Math.floor(Date.now() / 1000);
  const currentRound = Math.floor(now / ROUND_SECONDS);
  const secondsLeft = ROUND_SECONDS - (now % ROUND_SECONDS);
  // Predict the NEXT round (ahead by +1)
  const nextRound = currentRound + 1;
  const p = predictRound(nextRound);
  return {
    roundIndex: nextRound,
    secondsLeft,
    ...p,
  };
};

const colorClass = (c: Prediction["color"]) => {
  if (c === "RED") return "bg-red-500/20 text-red-400 border-red-500/40";
  if (c === "GREEN") return "bg-green-500/20 text-green-400 border-green-500/40";
  return "bg-violet-500/20 text-violet-400 border-violet-500/40";
};

export const WingoPredictor = () => {
  const [info, setInfo] = useState<Prediction>(getPrediction());

  useEffect(() => {
    // Update 4x per second for smoother countdown and instant refresh on round change
    const id = setInterval(() => setInfo(getPrediction()), 250);
    return () => clearInterval(id);
  }, []);

  const { secondsLeft, size, sizeConfidence, color, colorConfidence, digit, digitConfidence, roundIndex } = info;
  const isBig = size === "BIG";
  const periodId = String(roundIndex).slice(-6);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-neon-magenta/40 text-neon-magenta hover:bg-neon-magenta/10 hover:text-neon-magenta"
        >
          <Dices className="w-4 h-4" />
          <span className="hidden sm:inline">Wingo</span>
          <span
            className={`px-1.5 py-0.5 rounded text-xs font-bold ${
              isBig ? "bg-neon-cyan/20 text-neon-cyan" : "bg-neon-orange/20 text-neon-orange"
            }`}
          >
            {size}
          </span>
          <span className={`px-1.5 py-0.5 rounded text-xs font-bold border ${colorClass(color)}`}>
            {color[0]}
          </span>
          <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-foreground/10">
            {digit}
          </span>
          <span className="text-xs tabular-nums opacity-80">{secondsLeft}s</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-neon-magenta" />
              <h4 className="font-semibold">Wingo 30s Predictor</h4>
            </div>
            <span className="text-xs text-muted-foreground">Next #{periodId}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-border p-2 bg-background/50 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">Size</p>
              <p className={`text-lg font-bold ${isBig ? "text-neon-cyan" : "text-neon-orange"}`}>
                {size}
              </p>
              <p className="text-[10px] text-muted-foreground">{sizeConfidence}%</p>
            </div>
            <div className="rounded-lg border border-border p-2 bg-background/50 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">Color</p>
              <p
                className={`text-lg font-bold ${
                  color === "RED"
                    ? "text-red-400"
                    : color === "GREEN"
                    ? "text-green-400"
                    : "text-violet-400"
                }`}
              >
                {color}
              </p>
              <p className="text-[10px] text-muted-foreground">{colorConfidence}%</p>
            </div>
            <div className="rounded-lg border border-border p-2 bg-background/50 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">Digit</p>
              <p className="text-lg font-bold text-foreground">{digit}</p>
              <p className="text-[10px] text-muted-foreground">{digitConfidence}%</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Next round in</span>
            <span className="font-mono font-bold tabular-nums">{secondsLeft}s</span>
          </div>

          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-neon-magenta to-neon-cyan transition-all duration-300 ease-linear"
              style={{ width: `${((ROUND_SECONDS - secondsLeft) / ROUND_SECONDS) * 100}%` }}
            />
          </div>

          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Shows prediction for the upcoming round (ahead by 1). For entertainment only — outcomes are not guaranteed.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};
