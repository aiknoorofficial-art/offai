import { useEffect, useState } from "react";
import { Dices, TrendingUp, Sparkles, ExternalLink, Clock, Lock, Copy, CheckCircle2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ROUND_SECONDS = 30;
const GAME_URL = "https://FantasyGems.bio";
const EASYPAISA_NUMBER = "03070529899";
const EASYPAISA_NAME = "Muhammad Ishfaq";
const REQUIRED_AMOUNT = 500;

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
  startsAt: Date;
  secondsUntilStart: number;
};

type AccessStatus = "loading" | "none" | "pending" | "approved" | "rejected";

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
    digit, size, color,
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
  return { roundIndex: nextRound, secondsLeft, ...predictRound(nextRound) };
};

const getSureShots = (count = 3): SureShot[] => {
  const now = Math.floor(Date.now() / 1000);
  const currentRound = Math.floor(now / ROUND_SECONDS);
  const candidates: Array<{ score: number; round: number; p: ReturnType<typeof predictRound> }> = [];
  for (let i = 1; i <= 60; i++) {
    const r = currentRound + i;
    const p = predictRound(r);
    candidates.push({ score: p.sizeConfidence + p.colorConfidence, round: r, p });
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, count).sort((a, b) => a.round - b.round).map(({ round, p }) => {
    const startsAtSec = round * ROUND_SECONDS;
    return {
      roundIndex: round, size: p.size, color: p.color,
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
  const [userId, setUserId] = useState<string | null>(null);
  const [access, setAccess] = useState<AccessStatus>("loading");

  // Payment dialog state
  const [payOpen, setPayOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [form, setForm] = useState({
    tx_id: "",
    sender_name: "",
    sender_account: "",
    receiver_name: EASYPAISA_NAME,
    receiver_account: EASYPAISA_NUMBER,
    amount: String(REQUIRED_AMOUNT),
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setInfo(getPrediction());
      setSureShots(getSureShots());
    }, 250);
    return () => clearInterval(id);
  }, []);

  const loadAccess = async (uid: string) => {
    const { data } = await supabase
      .from("wingo_access_requests")
      .select("status")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(1);
    const s = data?.[0]?.status;
    if (s === "approved") setAccess("approved");
    else if (s === "pending") setAccess("pending");
    else if (s === "rejected") setAccess("rejected");
    else setAccess("none");
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) loadAccess(uid);
      else setAccess("none");
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) loadAccess(uid);
      else setAccess("none");
    });
    return () => subscription.unsubscribe();
  }, []);

  // Live update when admin approves
  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel(`wingo-access-${userId}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "wingo_access_requests", filter: `user_id=eq.${userId}` },
        () => loadAccess(userId)
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId]);

  const { secondsLeft, size, sizeConfidence, color, colorConfidence, digit, digitConfidence, roundIndex } = info;
  const isBig = size === "BIG";
  const periodId = String(roundIndex).slice(-6);
  const isApproved = access === "approved";

  const handleTriggerClick = (e: React.MouseEvent) => {
    if (!userId) {
      e.preventDefault();
      toast.error("Please sign in to use Wingo signal");
      return;
    }
    if (!isApproved) {
      e.preventDefault();
      setStep(access === "pending" ? 4 : 1);
      setPayOpen(true);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  const submitRequest = async () => {
    if (!userId) return;
    if (!form.tx_id.trim() || !form.sender_name.trim() || !form.sender_account.trim() || !form.amount) {
      toast.error("Please fill all fields"); return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("wingo_access_requests").insert({
      user_id: userId,
      tx_id: form.tx_id.trim(),
      sender_name: form.sender_name.trim(),
      sender_account: form.sender_account.trim(),
      receiver_name: form.receiver_name.trim(),
      receiver_account: form.receiver_account.trim(),
      amount: Number(form.amount),
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    setAccess("pending");
    setStep(4);
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTriggerClick}
            className="gap-1.5 border-neon-magenta/40 text-neon-magenta hover:bg-neon-magenta/10 hover:text-neon-magenta"
          >
            {isApproved ? <Dices className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            <span className="hidden sm:inline">Wingo</span>
            {isApproved ? (
              <>
                <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${isBig ? "bg-neon-cyan/20 text-neon-cyan" : "bg-neon-orange/20 text-neon-orange"}`}>{size}</span>
                <span className={`px-1.5 py-0.5 rounded text-xs font-bold border ${colorClass(color)}`}>{color[0]}</span>
                <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-foreground/10">{digit}</span>
                <span className="text-xs tabular-nums opacity-80">{secondsLeft}s</span>
              </>
            ) : (
              <span className="text-xs">{access === "pending" ? "Under Review" : "Locked"}</span>
            )}
          </Button>
        </PopoverTrigger>
        {isApproved && (
          <PopoverContent align="end" className="w-96">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-neon-magenta" />
                  <h4 className="font-semibold">Wingo 30s Predictor</h4>
                </div>
                <a href={GAME_URL} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-neon-cyan hover:underline inline-flex items-center gap-1">
                  Play <ExternalLink className="w-3 h-3" />
                </a>
              </div>

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
                    <p className={`text-base font-bold ${color === "RED" ? "text-red-400" : color === "GREEN" ? "text-green-400" : "text-violet-400"}`}>{color}</p>
                    <p className="text-[10px] text-muted-foreground">{colorConfidence}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Digit</p>
                    <p className="text-base font-bold text-foreground">{digit}</p>
                    <p className="text-[10px] text-muted-foreground">{digitConfidence}%</p>
                  </div>
                </div>
                <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-neon-magenta to-neon-cyan transition-all duration-300 ease-linear"
                    style={{ width: `${((ROUND_SECONDS - secondsLeft) / ROUND_SECONDS) * 100}%` }} />
                </div>
              </div>

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
                      <li key={s.roundIndex}
                        className="flex items-center justify-between gap-2 rounded-md border border-border bg-background/60 px-2 py-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-mono leading-tight">{fmtTime(s.startsAt)}</p>
                            <p className="text-[10px] text-muted-foreground leading-tight">#{pid} · in {fmtCountdown(s.secondsUntilStart)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${s.size === "BIG" ? "bg-neon-cyan/20 text-neon-cyan" : "bg-neon-orange/20 text-neon-orange"}`}>{s.size}</span>
                          <span className={`px-1.5 py-0.5 rounded text-xs font-bold border ${colorClass(s.color)}`}>{s.color}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-neon-magenta/20 text-neon-magenta">100%</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <a href={GAME_URL} target="_blank" rel="noopener noreferrer"
                  className="mt-2 flex items-center justify-center gap-1.5 w-full text-xs font-semibold py-1.5 rounded-md bg-neon-magenta/20 text-neon-magenta hover:bg-neon-magenta/30 transition-colors">
                  Open FantasyGems.bio <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Predictions are for entertainment only — no outcome is actually guaranteed.
              </p>
            </div>
          </PopoverContent>
        )}
      </Popover>

      {/* Payment / Access dialog */}
      <Dialog open={payOpen} onOpenChange={(o) => { setPayOpen(o); if (!o) setStep(access === "pending" ? 4 : 1); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {step === 4 ? <CheckCircle2 className="w-5 h-5 text-neon-cyan" /> : <Lock className="w-5 h-5 text-neon-magenta" />}
              {step === 1 && "Wingo Signal — Payment Required"}
              {step === 2 && "Send Payment via Easypaisa"}
              {step === 3 && "Submit Payment Details"}
              {step === 4 && "Under Review"}
            </DialogTitle>
          </DialogHeader>

          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Wingo signal access requires a one-time payment of <span className="text-neon-magenta font-bold">Rs. {REQUIRED_AMOUNT}</span>.
                After admin approval you will receive accurate predictions for Wingo 30s.
              </p>
              <div className="rounded-lg border border-neon-magenta/30 bg-neon-magenta/5 p-3 text-sm space-y-1">
                <p>✓ Live BIG/SMALL, color & digit predictions</p>
                <p>✓ Sure Shot 100% picks with timed periods</p>
                <p>✓ Lifetime access after approval</p>
              </div>
              <DialogFooter>
                <Button onClick={() => setStep(2)} className="w-full">Next</Button>
              </DialogFooter>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Send <span className="text-neon-magenta font-bold">Rs. {REQUIRED_AMOUNT}</span> to the Easypaisa account below:</p>
              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Easypaisa Number</p>
                    <p className="font-mono font-bold text-base">{EASYPAISA_NUMBER}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => copy(EASYPAISA_NUMBER)}>
                    <Copy className="w-3.5 h-3.5 mr-1" />Copy
                  </Button>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Account Name</p>
                  <p className="font-semibold">{EASYPAISA_NAME}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="font-semibold text-neon-magenta">Rs. {REQUIRED_AMOUNT}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">After sending, click Next to enter your transaction details.</p>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={() => setStep(3)}>Next</Button>
              </DialogFooter>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Enter the payment details. Rs. {REQUIRED_AMOUNT} required.</p>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs">Transaction ID (TX ID)</Label>
                  <Input value={form.tx_id} onChange={(e) => setForm({ ...form, tx_id: e.target.value })} placeholder="e.g. 12345678901" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Sender Name</Label>
                    <Input value={form.sender_name} onChange={(e) => setForm({ ...form, sender_name: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Sender Account</Label>
                    <Input value={form.sender_account} onChange={(e) => setForm({ ...form, sender_account: e.target.value })} placeholder="03xxxxxxxxx" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Receiver Name</Label>
                    <Input value={form.receiver_name} onChange={(e) => setForm({ ...form, receiver_name: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Receiver Account</Label>
                    <Input value={form.receiver_account} onChange={(e) => setForm({ ...form, receiver_account: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Amount (PKR)</Label>
                  <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setStep(2)} disabled={submitting}>Back</Button>
                <Button onClick={submitRequest} disabled={submitting}>
                  {submitting ? "Submitting..." : "Next"}
                </Button>
              </DialogFooter>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3 text-center py-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-neon-cyan/20 flex items-center justify-center">
                <Clock className="w-8 h-8 text-neon-cyan animate-pulse" />
              </div>
              <h3 className="text-lg font-bold">Your information is under review</h3>
              <p className="text-sm text-muted-foreground">
                Please wait approximately <span className="text-neon-cyan font-semibold">20 minutes</span> while our admin verifies your payment.
                You will be notified once approved and Wingo signals will unlock automatically.
              </p>
              <DialogFooter>
                <Button onClick={() => setPayOpen(false)} className="w-full">Got it</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
