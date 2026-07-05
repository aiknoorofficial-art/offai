import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AnimatedSection } from "@/components/AnimatedSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "@supabase/supabase-js";
import {
  Zap, Code, Sparkles, ArrowRight, Video, MessageSquare, Shield,
  Cpu, Wallet, ShoppingCart, Clock, Banknote, Image as ImageIcon,
  GraduationCap, Gift, CheckCircle2, Rocket, Star,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import AdSense from "@/components/AdSense";
import aiShowcase from "@/assets/ai-showcase.jpg";
import heroVideo from "@/assets/hero-video.mp4.asset.json";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("");
  const [withdrawAccount, setWithdrawAccount] = useState("");
  const [withdrawName, setWithdrawName] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const [showHeroVideo, setShowHeroVideo] = useState(true);
  const [binanceUid, setBinanceUid] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setShowHeroVideo(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchEarnings(session.user.id);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchEarnings(session.user.id);
        fetchWithdrawn(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchWithdrawn = async (userId: string) => {
    const { data } = await supabase
      .from("withdrawals")
      .select("amount, status")
      .eq("user_id", userId);
    if (data) {
      const approved = data.filter(w => w.status === "approved" || w.status === "pending");
      setTotalWithdrawn(approved.reduce((sum, w) => sum + Number(w.amount), 0));
    }
  };

  const fetchEarnings = async (userId: string) => {
    const { data: orders } = await supabase
      .from("course_orders")
      .select("status, course_id")
      .eq("seller_id", userId);

    if (!orders) return;

    const acceptedOrders = orders.filter((o) => o.status === "accepted");
    const pending = orders.filter((o) => o.status === "pending").length;
    setTotalOrders(orders.length);
    setPendingOrders(pending);

    if (acceptedOrders.length === 0) { setBalance(0); return; }

    const courseIds = [...new Set(acceptedOrders.map((o) => o.course_id))];
    const { data: courses } = await supabase
      .from("courses")
      .select("id, price")
      .in("id", courseIds);

    const priceMap = Object.fromEntries((courses || []).map((c) => [c.id, c.price]));
    const total = acceptedOrders.reduce((sum, o) => sum + (priceMap[o.course_id] || 0), 0);
    setBalance(total);
  };

  const isBinance = withdrawMethod === "Binance USDT TRC20";

  const handleWithdraw = async () => {
    if (!user) return;
    const amount = Number(withdrawAmount);
    const available = balance - totalWithdrawn;

    if (isBinance) {
      if (!amount || amount < 3) {
        toast({ title: "Minimum $3", description: "Binance USDT TRC20 minimum withdrawal is $3", variant: "destructive" });
        return;
      }
      if (!withdrawName || !binanceUid) {
        toast({ title: "Fill all fields", description: "Binance username and UID are required", variant: "destructive" });
        return;
      }
    } else {
      if (!amount || amount <= 0 || amount > available) {
        toast({ title: "Invalid amount", description: `You can withdraw up to Rs. ${available.toLocaleString()}`, variant: "destructive" });
        return;
      }
      if (!withdrawMethod || !withdrawAccount || !withdrawName) {
        toast({ title: "Fill all fields", variant: "destructive" });
        return;
      }
    }

    setWithdrawLoading(true);
    const { error } = await supabase.from("withdrawals").insert({
      user_id: user.id,
      amount,
      method: withdrawMethod,
      account_number: isBinance ? `UID: ${binanceUid}` : withdrawAccount,
      account_name: withdrawName,
    });
    setWithdrawLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Withdrawal Requested!", description: `${isBinance ? '$' : 'Rs. '}${amount.toLocaleString()} via ${withdrawMethod}` });
      setWithdrawOpen(false);
      setWithdrawAmount("");
      setWithdrawMethod("");
      setWithdrawAccount("");
      setWithdrawName("");
      setBinanceUid("");
      fetchWithdrawn(user.id);
    }
  };

  const available = balance - totalWithdrawn;

  return (
    <div className="min-h-screen bg-gradient-dark flex flex-col overflow-x-hidden">
      <Header user={user} />

      {/* ============ HERO ============ */}
      <section className="relative pt-24 pb-10 sm:pt-32 sm:pb-16 px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-neon-purple/25 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-0 -right-20 w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] bg-neon-cyan/20 rounded-full blur-[100px]" />
          <div className="absolute top-1/3 right-1/4 w-[200px] h-[200px] bg-neon-yellow/10 rounded-full blur-[80px]" />
        </div>

        <div className="container mx-auto relative z-10">
          <AnimatedSection className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-gradient text-xs sm:text-sm mb-5 sm:mb-8">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neon-magenta" />
              <span className="gradient-text-multi font-semibold">One Platform · Six AI Tools · Earn Money</span>
            </div>

            <h1 className="text-[2.25rem] leading-[1.1] sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6 tracking-tight">
              <span className="text-foreground">Build. </span>
              <span className="gradient-text-cyber animate-gradient">Create.</span>
              <br />
              <span className="text-neon-cyan text-glow-cyan">Earn with AI.</span>
            </h1>

            <p className="text-base sm:text-xl text-muted-foreground mb-7 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
              Generate code, videos, thumbnails and more — then sell your own AI courses and get paid in PKR or USDT. All in one place.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 max-w-sm sm:max-w-none mx-auto">
              <Link to={user ? "/generate" : "/auth?mode=signup"} className="w-full sm:w-auto">
                <Button variant="hero" size="xl" className="w-full bg-gradient-to-r from-neon-yellow via-neon-orange to-neon-magenta hover:opacity-90 text-background">
                  <Zap className="w-5 h-5 mr-2" />
                  Start Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to={user ? "/chat" : "/auth"} className="w-full sm:w-auto">
                <Button variant="outline" size="xl" className="w-full border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10 hover:border-neon-cyan">
                  {user ? "Open Dashboard" : "Sign In"}
                </Button>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs sm:text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-neon-green" /> No credit card</span>
              <span className="inline-flex items-center gap-1.5"><Shield className="w-4 h-4 text-neon-cyan" /> Secure &amp; private</span>
              <span className="inline-flex items-center gap-1.5"><Star className="w-4 h-4 text-neon-yellow" /> Free forever plan</span>
            </div>
          </AnimatedSection>

          {/* Hero Video */}
          <div
            className={`mt-10 sm:mt-14 max-w-5xl mx-auto transition-all duration-1000 ease-in-out ${
              showHeroVideo
                ? "opacity-100 translate-y-0 scale-100 max-h-[800px]"
                : "opacity-0 -translate-y-8 scale-95 max-h-0 pointer-events-none"
            }`}
          >
            <div className="relative rounded-xl sm:rounded-2xl overflow-hidden border border-neon-cyan/20 shadow-[0_0_60px_hsl(180_100%_50%/0.15)]">
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent z-10 pointer-events-none" />
              <video autoPlay muted loop playsInline className="w-full aspect-video object-cover" poster={aiShowcase}>
                <source src={heroVideo.url} type="video/mp4" />
              </video>
              <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 px-2.5 py-1 rounded-full bg-background/60 backdrop-blur-sm border border-neon-cyan/30">
                <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
                <span className="text-[10px] sm:text-xs text-neon-cyan font-medium">AI in Action</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ EARNINGS (logged in) ============ */}
      {user && (
        <section className="py-8 sm:py-12 px-4">
          <div className="container mx-auto">
            <AnimatedSection className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold mb-1">
                <span className="gradient-text-multi">My Earnings</span>
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">Your course sales at a glance</p>
            </AnimatedSection>

            <div className="grid grid-cols-3 gap-2.5 sm:gap-6 max-w-3xl mx-auto">
              <EarnCard color="green" icon={<Wallet className="w-5 h-5 sm:w-6 sm:h-6" />} value={`Rs.${available.toLocaleString()}`} label="Available" />
              <EarnCard color="cyan" icon={<ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />} value={String(totalOrders)} label="Orders" />
              <EarnCard color="yellow" icon={<Clock className="w-5 h-5 sm:w-6 sm:h-6" />} value={String(pendingOrders)} label="Pending" />
            </div>

            <div className="flex justify-center mt-5">
              <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto border-neon-orange/50 text-neon-orange hover:bg-neon-orange/10 gap-2 max-w-xs">
                    <Banknote className="w-5 h-5" />
                    Withdraw Funds
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="gradient-text-multi text-xl">Withdraw Funds</DialogTitle>
                  </DialogHeader>
                  <p className="text-muted-foreground text-sm">Available: <span className="text-neon-green font-bold">Rs. {available.toLocaleString()}</span></p>
                  <div className="space-y-4 mt-2">
                    <div>
                      <Label>{isBinance ? "Amount (USD)" : "Amount (PKR)"}</Label>
                      <Input type="number" placeholder={isBinance ? "Minimum $3" : "Enter amount"} value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
                      {isBinance && <p className="text-xs text-muted-foreground mt-1">Minimum withdrawal: $3 USDT</p>}
                    </div>
                    <div>
                      <Label>Payment Method</Label>
                      <Select value={withdrawMethod} onValueChange={(v) => { setWithdrawMethod(v); setWithdrawAccount(""); setWithdrawName(""); setBinanceUid(""); }}>
                        <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Easypaisa">Easypaisa</SelectItem>
                          <SelectItem value="JazzCash">JazzCash</SelectItem>
                          <SelectItem value="NayaPay">NayaPay</SelectItem>
                          <SelectItem value="SadaPay">SadaPay</SelectItem>
                          <SelectItem value="Bank Transfer (Pakistan)">Bank Transfer (Pakistan)</SelectItem>
                          <SelectItem value="Binance USDT TRC20">Binance USDT TRC20</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {isBinance ? (
                      <>
                        <div>
                          <Label>Binance Username</Label>
                          <Input placeholder="Your Binance username" value={withdrawName} onChange={(e) => setWithdrawName(e.target.value)} />
                        </div>
                        <div>
                          <Label>Binance UID</Label>
                          <Input placeholder="Your Binance UID number" value={binanceUid} onChange={(e) => setBinanceUid(e.target.value)} />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <Label>Account Number</Label>
                          <Input placeholder="03XXXXXXXXX" value={withdrawAccount} onChange={(e) => setWithdrawAccount(e.target.value)} />
                        </div>
                        <div>
                          <Label>Account Holder Name</Label>
                          <Input placeholder="Full name" value={withdrawName} onChange={(e) => setWithdrawName(e.target.value)} />
                        </div>
                      </>
                    )}
                    <Button onClick={handleWithdraw} disabled={withdrawLoading} className="w-full bg-gradient-to-r from-neon-orange to-neon-yellow text-background">
                      {withdrawLoading ? "Submitting..." : "Submit Withdrawal Request"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </section>
      )}

      {/* ============ PRODUCTS (mobile bento) ============ */}
      <section className="py-12 sm:py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-glow pointer-events-none" />
        <div className="container mx-auto relative z-10">
          <AnimatedSection className="text-center mb-8 sm:mb-14">
            <span className="text-xs uppercase tracking-[0.2em] text-neon-cyan font-semibold">Toolkit</span>
            <h2 className="text-2xl sm:text-4xl font-bold mt-2 mb-3">
              <span className="gradient-text-multi">Everything you need to create</span>
            </h2>
            <p className="text-sm sm:text-lg text-muted-foreground max-w-xl mx-auto">
              Six pro tools. One click away. Built for creators, coders and entrepreneurs.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 max-w-5xl mx-auto">
            <ProductCard to={user ? "/generate" : "/auth"} color="cyan" icon={<Code className="w-6 h-6 sm:w-8 sm:h-8" />} title="Code Generator" desc="Ship production-ready code in 20+ languages." tag="Try it" wide />
            <ProductCard to={user ? "/video" : "/auth"} color="magenta" icon={<Video className="w-6 h-6 sm:w-8 sm:h-8" />} title="Video Generator" desc="Text-to-video with Runway Gen-3." tag="Create" />
            <ProductCard to={user ? "/chat" : "/auth"} color="yellow" icon={<MessageSquare className="w-6 h-6 sm:w-8 sm:h-8" />} title="AI Chat" desc="Fast answers powered by Gemini 2.5." tag="Chat" />
            <ProductCard to={user ? "/thumbnail" : "/auth"} color="purple" icon={<ImageIcon className="w-6 h-6 sm:w-8 sm:h-8" />} title="Thumbnail AI" desc="Click-worthy YouTube thumbnails in seconds." tag="Design" />
            <ProductCard to={user ? "/courses" : "/auth"} color="green" icon={<GraduationCap className="w-6 h-6 sm:w-8 sm:h-8" />} title="Courses" desc="Buy premium courses or list your own to earn." tag="Explore" />
            <ProductCard to={user ? "/referral" : "/auth"} color="orange" icon={<Gift className="w-6 h-6 sm:w-8 sm:h-8" />} title="Referral" desc="Share your link. Earn commission on every signup." tag="Invite" wide />
          </div>
        </div>
      </section>

      {/* ============ WHY US ============ */}
      <section className="py-12 sm:py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <AnimatedSection className="text-center mb-8 sm:mb-14">
            <span className="text-xs uppercase tracking-[0.2em] text-neon-purple font-semibold">Why OFFTOOL</span>
            <h2 className="text-2xl sm:text-4xl font-bold mt-2">
              <span className="text-foreground">Built for </span>
              <span className="text-neon-purple text-glow-purple">real creators</span>
            </h2>
          </AnimatedSection>

          <div className="space-y-3 sm:space-y-4">
            {([
              { icon: <Cpu className="w-5 h-5" />, color: "cyan", t: "State-of-the-art AI models", d: "Gemini 2.5 Flash for chat & code, Runway Gen-3 for video — always the latest." },
              { icon: <Rocket className="w-5 h-5" />, color: "magenta", t: "Lightning fast", d: "Streaming responses, no queues, generate results in seconds." },
              { icon: <Wallet className="w-5 h-5" />, color: "green", t: "Get paid, your way", d: "Easypaisa, JazzCash, NayaPay, SadaPay, Bank Transfer or USDT TRC20." },
              { icon: <Shield className="w-5 h-5" />, color: "yellow", t: "Private & secure", d: "Row-level security. Your data belongs to you — never shared, never sold." },
            ] as const).map((f, i) => (
              <AnimatedSection key={f.t} animation="fade-up" delay={i * 80}>
                <RowFeature {...f} />
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section className="py-10 sm:py-16 px-4 relative">
        <div className="absolute inset-0 bg-gradient-glow pointer-events-none" />
        <div className="container mx-auto relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 max-w-4xl mx-auto text-center">
            <Stat value="10K+" label="Active Users" color="cyan" />
            <Stat value="1M+" label="Generations" color="magenta" />
            <Stat value="50+" label="Languages" color="yellow" />
            <Stat value="99.9%" label="Uptime" color="purple" />
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="py-14 sm:py-20 px-4">
        <div className="container mx-auto">
          <AnimatedSection className="max-w-3xl mx-auto text-center rounded-2xl border-gradient p-8 sm:p-12 bg-card/40 backdrop-blur-sm">
            <h2 className="text-2xl sm:text-4xl font-bold mb-4">
              <span className="gradient-text-cyber animate-gradient">Ready to build with AI?</span>
            </h2>
            <p className="text-sm sm:text-lg text-muted-foreground mb-7">
              Join thousands creating, teaching, and earning with OFFTOOL — start free today.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-sm sm:max-w-none mx-auto">
              <Link to={user ? "/generate" : "/auth?mode=signup"} className="w-full sm:w-auto">
                <Button variant="hero" size="xl" className="w-full bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-magenta hover:opacity-90 text-background">
                  <Zap className="w-5 h-5 mr-2" />
                  Get Started Free
                </Button>
              </Link>
              <Link to="/changelog" className="w-full sm:w-auto">
                <Button variant="outline" size="xl" className="w-full border-neon-purple/50 text-neon-purple hover:bg-neon-purple/10">
                  What's New
                </Button>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <div className="container mx-auto px-4">
        <AdSense />
      </div>
      <Footer />
    </div>
  );
};

/* ---------------- helpers ---------------- */

const colorMap = {
  cyan: { text: "text-neon-cyan", bg: "bg-neon-cyan/10", border: "border-neon-cyan/25", hover: "hover:border-neon-cyan/60", glow: "text-glow-cyan" },
  magenta: { text: "text-neon-magenta", bg: "bg-neon-magenta/10", border: "border-neon-magenta/25", hover: "hover:border-neon-magenta/60", glow: "text-glow-magenta" },
  yellow: { text: "text-neon-yellow", bg: "bg-neon-yellow/10", border: "border-neon-yellow/25", hover: "hover:border-neon-yellow/60", glow: "text-glow" },
  purple: { text: "text-neon-purple", bg: "bg-neon-purple/10", border: "border-neon-purple/25", hover: "hover:border-neon-purple/60", glow: "text-glow-purple" },
  green: { text: "text-neon-green", bg: "bg-neon-green/10", border: "border-neon-green/25", hover: "hover:border-neon-green/60", glow: "" },
  orange: { text: "text-neon-orange", bg: "bg-neon-orange/10", border: "border-neon-orange/25", hover: "hover:border-neon-orange/60", glow: "" },
} as const;

type ColorKey = keyof typeof colorMap;

const EarnCard = ({ color, icon, value, label }: { color: ColorKey; icon: React.ReactNode; value: string; label: string }) => {
  const c = colorMap[color];
  return (
    <div className={`p-3 sm:p-6 rounded-xl bg-card/80 backdrop-blur-sm border ${c.border} ${c.hover} transition-all text-center`}>
      <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-lg ${c.bg} flex items-center justify-center ${c.text} mx-auto mb-2 sm:mb-3`}>
        {icon}
      </div>
      <div className={`text-base sm:text-3xl font-bold ${c.text} ${c.glow} mb-0.5 sm:mb-1 truncate`}>{value}</div>
      <p className="text-muted-foreground text-[10px] sm:text-sm">{label}</p>
    </div>
  );
};

const ProductCard = ({
  to, color, icon, title, desc, tag, wide,
}: { to: string; color: ColorKey; icon: React.ReactNode; title: string; desc: string; tag: string; wide?: boolean }) => {
  const c = colorMap[color];
  return (
    <Link to={to} className={`group block ${wide ? "col-span-2 md:col-span-1" : ""}`}>
      <div className={`h-full bg-card/70 backdrop-blur-sm border ${c.border} rounded-xl p-4 sm:p-7 ${c.hover} transition-all duration-300`}>
        <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-lg ${c.bg} flex items-center justify-center ${c.text} mb-3 sm:mb-5 group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <h3 className="text-base sm:text-xl font-semibold text-foreground mb-1.5 sm:mb-2">{title}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-3 leading-relaxed">{desc}</p>
        <span className={`${c.text} text-xs sm:text-sm font-medium inline-flex items-center gap-1`}>
          {tag} <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </Link>
  );
};

const RowFeature = ({ icon, color, t, d }: { icon: React.ReactNode; color: ColorKey; t: string; d: string }) => {
  const c = colorMap[color];
  return (
    <div className={`flex items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl bg-card/60 backdrop-blur-sm border ${c.border} ${c.hover} transition-all`}>
      <div className={`shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-lg ${c.bg} flex items-center justify-center ${c.text}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <h3 className="font-semibold text-foreground text-sm sm:text-base mb-0.5">{t}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{d}</p>
      </div>
    </div>
  );
};

const Stat = ({ value, label, color }: { value: string; label: string; color: ColorKey }) => {
  const c = colorMap[color];
  return (
    <div className={`p-4 sm:p-6 rounded-xl bg-card/50 backdrop-blur-sm border ${c.border}`}>
      <div className={`text-2xl sm:text-4xl font-bold ${c.text} ${c.glow} mb-1`}>{value}</div>
      <p className="text-muted-foreground text-xs sm:text-sm">{label}</p>
    </div>
  );
};

export default Index;
