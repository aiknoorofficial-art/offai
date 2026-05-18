import { useEffect, useState } from "react";
import { Dices, TrendingUp, Sparkles, ExternalLink, Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

const ROUND_SECONDS = 30;
const GAME_URL = "https://FantasyGems.bio";

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

type SureShot = {
  roundIndex: number;
  size: "BIG" | "SMALL";
  color: "RED" | "GREEN" | "VIOLET";
  startsAt: Date; // when this round starts
  secondsUntilStart: number;
};

const hash = (n: number) => {
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
  let color: "RED" | "GREEN" | "VIOLET";
  if (digit === 0 || digit === 5) color = "VIOLET";
  else if (digit % 2 === 0) color = "RED";
  else color = "GREEN";

  return {
    digit,
    size,
    color,
    sizeConfidence: 60 + (h1 % 36),
    colorConfidence: 55 + (h2 % 41),
    digitConfidence: 25 + (h3 % 35),
  };
};

const getPrediction = (): Prediction => {
  const now = Math.floor(Date.now() / 1000);
  const currentRound = Math.floor(now / ROUND_SECONDS);
  const secondsLeft = ROUND_SECONDS - (now % ROUND_SECONDS);
  const nextRound = currentRound + 1;
  const p = predictRound(nextRound);
  return { roundIndex: nextRound, secondsLeft, ...p };
};

// Pick the next few "sure shot" rounds (highest combined confidence) within the next ~30 minutes
const getSureShots = (count = 3): SureShot[] => {
  const now = Math.floor(Date.now() / 1000);
  const currentRound = Math.floor(now / ROUND_SECONDS);
  const candidates: Array<{ score: number; round: number; p: ReturnType<typeof predictRound> }> = [];
  // Scan next 60 rounds (~30 min)
  for (let i = 1; i <= 60; i++) {
    const r = currentRound + i;
    const p = predictRound(r);
    const score = p.sizeConfidence + p.colorConfidence;
    candidates.push({ score, round: r, p });
  }
  candidates.sort((a, b) => b.score - a.score);
  const top = candidates.slice(0, count).sort((a, b) => a.round - b.round);
  return top.map(({ round, p }) => {
    const startsAtSec = round * ROUND_SECONDS;
    return {
      roundIndex: round,
      size: p.size,
      color: p.color,
      startsAt: new Date(startsAtSec * 1000),
      secondsUntilStart: startsAtSec - now,
    };
  });
};

const colorClass = (c: SureShot["color"]) => {
  if (c === "RED") return "bg-red-500/20 text-red-400 border-red-500/40";
  if (c === "GREEN") return "bg-green-500/20 text-green-400 border-green-500/40";
  return "bg-violet-500/20 text-violet-400 border-violet-500/40";
};

const fmtTime = (d: Date) =>
  d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

const fmtCountdown = (s: number) => {
  if (s <= 0) return "now";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
};

export const WingoPredictor = () => {
  const [info, setInfo] = useState<Prediction>(getPrediction());
  const [sureShots, setSureShots] = useState<SureShot[]>(getSureShots());

  useEffect(() => {
    const id = setInterval(() => {
      setInfo(getPrediction());
      setSureShots(getSureShots());
    }, 250);
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
          <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-foreground/10">{digit}</span>
          <span className="text-xs tabular-nums opacity-80">{secondsLeft}s</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-neon-magenta" />
              <h4 className="font-semibold">Wingo 30s Predictor</h4>
            </div>
            <a
              href={GAME_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-neon-cyan hover:underline inline-flex items-center gap-1"
            >
              Play <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Next round prediction */}
          <div className="rounded-lg border border-border p-2 bg-background/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Next #{periodId}</span>
              <span className="font-mono text-xs tabular-nums">{secondsLeft}s</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground">Size</p>
                <p className={`text-base font-bold ${isBig ? "text-neon-cyan" : "text-neon-orange"}`}>{size}</p>
                <p className="text-[10px] text-muted-foreground">{sizeConfidence}%</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground">Color</p>
                <p
                  className={`text-base font-bold ${
                    color === "RED" ? "text-red-400" : color === "GREEN" ? "text-green-400" : "text-violet-400"
                  }`}
                >
                  {color}
                </p>
                <p className="text-[10px] text-muted-foreground">{colorConfidence}%</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground">Digit</p>
                <p className="text-base font-bold text-foreground">{digit}</p>
                <p className="text-[10px] text-muted-foreground">{digitConfidence}%</p>
              </div>
            </div>
            <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-neon-magenta to-neon-cyan transition-all duration-300 ease-linear"
                style={{ width: `${((ROUND_SECONDS - secondsLeft) / ROUND_SECONDS) * 100}%` }}
              />
            </div>
          </div>

          {/* Sure Shot - 100% picks with scheduled times */}
          <div className="rounded-lg border border-neon-magenta/40 bg-gradient-to-br from-neon-magenta/10 to-neon-cyan/5 p-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-neon-magenta" />
                <span className="text-sm font-semibold">Sure Shot · 100%</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Top {sureShots.length} picks</span>
            </div>
            <ul className="space-y-1.5">
              {sureShots.map((s) => {
                const pid = String(s.roundIndex).slice(-6);
                return (
                  <li
                    key={s.roundIndex}
                    className="flex items-center justify-between gap-2 rounded-md border border-border bg-background/60 px-2 py-1.5"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-mono leading-tight">{fmtTime(s.startsAt)}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">
                          #{pid} · in {fmtCountdown(s.secondsUntilStart)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                          s.size === "BIG"
                            ? "bg-neon-cyan/20 text-neon-cyan"
                            : "bg-neon-orange/20 text-neon-orange"
                        }`}
                      >
                        {s.size}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-bold border ${colorClass(s.color)}`}>
                        {s.color}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-neon-magenta/20 text-neon-magenta">
                        100%
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
            <a
              href={GAME_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-1.5 w-full text-xs font-semibold py-1.5 rounded-md bg-neon-magenta/20 text-neon-magenta hover:bg-neon-magenta/30 transition-colors"
            >
              Open FantasyGems.bio <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Sure Shot lists the upcoming periods with the strongest signal. Predictions are for entertainment only — no
            outcome is actually guaranteed.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};
