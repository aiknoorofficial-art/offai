import { useEffect, useState } from "react";
import { Dices, TrendingUp } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

const ROUND_SECONDS = 30;

const getRoundInfo = () => {
  const now = Math.floor(Date.now() / 1000);
  const roundIndex = Math.floor(now / ROUND_SECONDS);
  const secondsLeft = ROUND_SECONDS - (now % ROUND_SECONDS);
  // Deterministic pseudo prediction per round
  const seed = (roundIndex * 9301 + 49297) % 233280;
  const rnd = seed / 233280;
  const prediction: "BIG" | "SMALL" = rnd > 0.5 ? "BIG" : "SMALL";
  const confidence = Math.round(55 + ((seed % 4000) / 100)); // 55-95
  return { roundIndex, secondsLeft, prediction, confidence };
};

export const WingoPredictor = () => {
  const [info, setInfo] = useState(getRoundInfo());

  useEffect(() => {
    const id = setInterval(() => setInfo(getRoundInfo()), 1000);
    return () => clearInterval(id);
  }, []);

  const { secondsLeft, prediction, confidence, roundIndex } = info;
  const isBig = prediction === "BIG";
  const periodId = String(roundIndex).slice(-6);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-neon-magenta/40 text-neon-magenta hover:bg-neon-magenta/10 hover:text-neon-magenta"
        >
          <Dices className="w-4 h-4" />
          <span className="hidden sm:inline">Wingo</span>
          <span
            className={`px-1.5 py-0.5 rounded text-xs font-bold ${
              isBig ? "bg-neon-cyan/20 text-neon-cyan" : "bg-neon-orange/20 text-neon-orange"
            }`}
          >
            {prediction}
          </span>
          <span className="text-xs tabular-nums opacity-80">{secondsLeft}s</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-neon-magenta" />
              <h4 className="font-semibold">Wingo 30s Predictor</h4>
            </div>
            <span className="text-xs text-muted-foreground">Period #{periodId}</span>
          </div>

          <div className="rounded-lg border border-border p-3 bg-background/50">
            <p className="text-xs text-muted-foreground mb-1">Next round prediction</p>
            <div className="flex items-baseline justify-between">
              <span
                className={`text-2xl font-bold ${
                  isBig ? "text-neon-cyan" : "text-neon-orange"
                }`}
              >
                {prediction}
              </span>
              <span className="text-sm font-medium">{confidence}% chance</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Time left</span>
            <span className="font-mono font-bold tabular-nums">{secondsLeft}s</span>
          </div>

          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-neon-magenta to-neon-cyan transition-all duration-1000 ease-linear"
              style={{ width: `${((ROUND_SECONDS - secondsLeft) / ROUND_SECONDS) * 100}%` }}
            />
          </div>

          <p className="text-[10px] text-muted-foreground leading-relaxed">
            For entertainment only. Predictions are algorithmic and do not guarantee outcomes.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};
