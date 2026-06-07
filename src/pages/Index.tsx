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
import { Zap, Code, Sparkles, Terminal, ArrowRight, Video, MessageSquare, Shield, Globe, Cpu, Users, Wallet, TrendingUp, ShoppingCart, Clock, Banknote } from "lucide-react";
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

  const [binanceUid, setBinanceUid] = useState("");

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

  return (
    <div className="min-h-screen bg-gradient-dark flex flex-col">
      <Header user={user} />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background Effects - Multi-color */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-neon-purple/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-neon-cyan/15 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 right-1/3 w-[300px] h-[300px] bg-neon-yellow/10 rounded-full blur-[80px]" />
          <div className="absolute inset-0 scanline opacity-20" />
        </div>

        <div className="container mx-auto relative z-10">
          <AnimatedSection className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-gradient text-neon-cyan text-sm mb-8">
              <Sparkles className="w-4 h-4 text-neon-magenta" />
              <span className="gradient-text-multi font-medium">The Future of AI Creation</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="text-foreground">Create </span>
              <span className="gradient-text-cyber animate-gradient">Anything</span>
              <br />
              <span className="text-neon-cyan text-glow-cyan">With AI Power</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed px-4 sm:px-0">
              OFF AI is your all-in-one AI platform. Generate code, create videos, chat with AI, and build amazing things—all in one place.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={user ? "/generate" : "/auth?mode=signup"}>
                <Button variant="hero" size="xl" className="bg-gradient-to-r from-neon-yellow via-neon-orange to-neon-magenta hover:opacity-90 text-background">
                  <Zap className="w-5 h-5 mr-2" />
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to={user ? "/chat" : "/auth"}>
                <Button variant="outline" size="xl" className="border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10 hover:border-neon-cyan">
                  {user ? "Open Dashboard" : "Sign In"}
                </Button>
              </Link>
            </div>
          </AnimatedSection>

          {/* Hero Video Showcase */}
          <AnimatedSection animation="fade-up" delay={200} className="mt-16 max-w-5xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden border border-neon-cyan/20 shadow-[0_0_60px_hsl(180_100%_50%/0.15)]">
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent z-10 pointer-events-none" />
              <video
                autoPlay
                muted
                loop
                playsInline
                className="w-full aspect-video object-cover"
                poster={aiShowcase}
              >
                <source src={heroVideo.url} type="video/mp4" />
              </video>
              <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/60 backdrop-blur-sm border border-neon-cyan/30">
                <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                <span className="text-xs text-neon-cyan font-medium">AI in Action</span>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Earnings Dashboard - only for logged in users */}
      {user && (
        <section className="py-12 px-4 relative overflow-hidden">
          <div className="container mx-auto relative z-10">
            <AnimatedSection className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                <span className="gradient-text-multi">My Earnings</span>
              </h2>
              <p className="text-muted-foreground">Your course sales at a glance</p>
            </AnimatedSection>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-3xl mx-auto">
              <AnimatedSection animation="fade-up" delay={0}>
                <div className="p-6 rounded-xl bg-card/80 backdrop-blur-sm border border-neon-green/20 hover:border-neon-green/50 transition-all duration-300 text-center">
                  <div className="w-12 h-12 rounded-lg bg-neon-green/10 flex items-center justify-center text-neon-green mx-auto mb-3">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div className="text-3xl font-bold text-neon-green text-glow-green mb-1">Rs. {(balance - totalWithdrawn).toLocaleString()}</div>
                  <p className="text-muted-foreground text-sm">Available Balance</p>
                </div>
              </AnimatedSection>

              <AnimatedSection animation="fade-up" delay={100}>
                <div className="p-6 rounded-xl bg-card/80 backdrop-blur-sm border border-neon-cyan/20 hover:border-neon-cyan/50 transition-all duration-300 text-center">
                  <div className="w-12 h-12 rounded-lg bg-neon-cyan/10 flex items-center justify-center text-neon-cyan mx-auto mb-3">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                  <div className="text-3xl font-bold text-neon-cyan text-glow-cyan mb-1">{totalOrders}</div>
                  <p className="text-muted-foreground text-sm">Total Orders</p>
                </div>
              </AnimatedSection>

              <AnimatedSection animation="fade-up" delay={200}>
                <Link to="/orders" className="block">
                  <div className="p-6 rounded-xl bg-card/80 backdrop-blur-sm border border-neon-yellow/20 hover:border-neon-yellow/50 transition-all duration-300 text-center cursor-pointer">
                    <div className="w-12 h-12 rounded-lg bg-neon-yellow/10 flex items-center justify-center text-neon-yellow mx-auto mb-3">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div className="text-3xl font-bold text-neon-yellow text-glow mb-1">{pendingOrders}</div>
                    <p className="text-muted-foreground text-sm">Pending Orders</p>
                  </div>
                </Link>
              </AnimatedSection>
            </div>

            {/* Withdraw Button */}
            <div className="flex justify-center mt-6">
              <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-neon-orange/50 text-neon-orange hover:bg-neon-orange/10 gap-2">
                    <Banknote className="w-5 h-5" />
                    Withdraw Funds
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle className="gradient-text-multi text-xl">Withdraw Funds</DialogTitle>
                  </DialogHeader>
                  <p className="text-muted-foreground text-sm">Available: <span className="text-neon-green font-bold">Rs. {(balance - totalWithdrawn).toLocaleString()}</span></p>
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

      {/* Products Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-glow pointer-events-none" />
        <div className="container mx-auto relative z-10">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="gradient-text-multi">Our AI Products</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Powerful AI tools designed to supercharge your creativity and productivity
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            <AnimatedSection animation="fade-up" delay={0}>
              <Link to={user ? "/generate" : "/auth"} className="group block h-full">
                <div className="bg-card/80 backdrop-blur-sm border border-neon-cyan/20 rounded-xl p-8 hover:border-neon-cyan/60 transition-all duration-300 hover:shadow-[0_0_30px_hsl(180_100%_50%/0.2)] h-full">
                  <div className="w-16 h-16 rounded-xl bg-neon-cyan/10 flex items-center justify-center text-neon-cyan mb-6 group-hover:bg-neon-cyan group-hover:text-background transition-all duration-300">
                    <Code className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-semibold text-foreground mb-3">Code Generator</h3>
                  <p className="text-muted-foreground mb-4">Transform your ideas into production-ready code. Supports JavaScript, Python, TypeScript, Rust, Go, and more.</p>
                  <span className="text-neon-cyan text-sm font-medium flex items-center gap-2 group-hover:text-glow-cyan">
                    Try it now <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            </AnimatedSection>

            <AnimatedSection animation="fade-up" delay={100}>
              <Link to={user ? "/video" : "/auth"} className="group block h-full">
                <div className="bg-card/80 backdrop-blur-sm border border-neon-magenta/20 rounded-xl p-8 hover:border-neon-magenta/60 transition-all duration-300 hover:shadow-[0_0_30px_hsl(300_100%_60%/0.2)] h-full">
                  <div className="w-16 h-16 rounded-xl bg-neon-magenta/10 flex items-center justify-center text-neon-magenta mb-6 group-hover:bg-neon-magenta group-hover:text-background transition-all duration-300">
                    <Video className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-semibold text-foreground mb-3">Video Generator</h3>
                  <p className="text-muted-foreground mb-4">Create stunning videos from text descriptions. AI-powered video generation for content creators and marketers.</p>
                  <span className="text-neon-magenta text-sm font-medium flex items-center gap-2">
                    Create video <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            </AnimatedSection>

            <AnimatedSection animation="fade-up" delay={200}>
              <Link to={user ? "/chat" : "/auth"} className="group block h-full">
                <div className="bg-card/80 backdrop-blur-sm border border-neon-yellow/20 rounded-xl p-8 hover:border-neon-yellow/60 transition-all duration-300 hover:shadow-[0_0_30px_hsl(50_100%_50%/0.2)] h-full">
                  <div className="w-16 h-16 rounded-xl bg-neon-yellow/10 flex items-center justify-center text-neon-yellow mb-6 group-hover:bg-neon-yellow group-hover:text-background transition-all duration-300">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-semibold text-foreground mb-3">AI Chat</h3>
                  <p className="text-muted-foreground mb-4">Have intelligent conversations with our advanced AI. Get answers, brainstorm ideas, and solve problems together.</p>
                  <span className="text-neon-yellow text-sm font-medium flex items-center gap-2">
                    Start chatting <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-foreground">Why Choose </span>
              <span className="text-neon-purple text-glow-purple">OFF AI</span>
              <span className="text-foreground">?</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Built with cutting-edge technology for maximum performance and reliability
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            <AnimatedSection animation="fade-up" delay={0}>
              <FeatureCard
                icon={<Cpu className="w-8 h-8" />}
                title="Advanced AI Models"
                description="Powered by state-of-the-art language models trained on billions of parameters for accurate results."
                color="cyan"
              />
            </AnimatedSection>
            <AnimatedSection animation="fade-up" delay={100}>
              <FeatureCard
                icon={<Shield className="w-8 h-8" />}
                title="Secure & Private"
                description="Your data is encrypted and never shared. We prioritize your privacy and security above all."
                color="magenta"
              />
            </AnimatedSection>
            <AnimatedSection animation="fade-up" delay={200}>
              <FeatureCard
                icon={<Globe className="w-8 h-8" />}
                title="Global Availability"
                description="Access OFF AI from anywhere in the world with our distributed infrastructure and fast response times."
                color="yellow"
              />
            </AnimatedSection>
            <AnimatedSection animation="fade-up" delay={300}>
              <FeatureCard
                icon={<Code className="w-8 h-8" />}
                title="Multiple Languages"
                description="Generate code in JavaScript, Python, TypeScript, Rust, Go, and 20+ programming languages."
                color="purple"
              />
            </AnimatedSection>
            <AnimatedSection animation="fade-up" delay={400}>
              <FeatureCard
                icon={<Terminal className="w-8 h-8" />}
                title="Clean Output"
                description="Get well-structured, commented code that's production-ready. No more copying from snippets."
                color="green"
              />
            </AnimatedSection>
            <AnimatedSection animation="fade-up" delay={500}>
              <FeatureCard
                icon={<Users className="w-8 h-8" />}
                title="Growing Community"
                description="Join thousands of developers and creators who trust OFF AI for their daily workflow."
                color="orange"
              />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-glow pointer-events-none" />
        <div className="container mx-auto relative z-10">
          <AnimatedSection>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 max-w-4xl mx-auto text-center">
              <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-neon-cyan/20">
                <div className="text-4xl font-bold text-neon-cyan text-glow-cyan mb-2">10K+</div>
                <p className="text-muted-foreground">Active Users</p>
              </div>
              <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-neon-magenta/20">
                <div className="text-4xl font-bold text-neon-magenta text-glow-magenta mb-2">1M+</div>
                <p className="text-muted-foreground">Code Generated</p>
              </div>
              <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-neon-yellow/20">
                <div className="text-4xl font-bold text-neon-yellow text-glow mb-2">50+</div>
                <p className="text-muted-foreground">Languages Supported</p>
              </div>
              <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-neon-purple/20">
                <div className="text-4xl font-bold text-neon-purple text-glow-purple mb-2">99.9%</div>
                <p className="text-muted-foreground">Uptime</p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <AnimatedSection className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              <span className="gradient-text-cyber animate-gradient">Ready to Create with AI?</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Join thousands of creators who are building amazing things with OFF AI.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={user ? "/generate" : "/auth?mode=signup"}>
                <Button variant="hero" size="xl" className="bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-magenta hover:opacity-90 text-background">
                  <Zap className="w-5 h-5 mr-2" />
                  Get Started Free
                </Button>
              </Link>
              <Link to="/changelog">
                <Button variant="outline" size="xl" className="border-neon-purple/50 text-neon-purple hover:bg-neon-purple/10">
                  View Changelog
                </Button>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <AnimatedSection className="max-w-5xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden border border-neon-purple/30 shadow-[0_0_40px_hsl(280_100%_60%/0.25)]">
            <img
              src={aiShowcase}
              alt="Neon AI workspace showcasing OFF AI's code, chat, and video tools"
              width={1536}
              height={768}
              loading="lazy"
              className="w-full h-auto object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none" />
          </div>
        </AnimatedSection>
      </div>

      <div className="container mx-auto px-4">
        <AdSense />
      </div>
      <Footer />
    </div>
  );
};

const colorClasses = {
  cyan: { bg: 'bg-neon-cyan/10', text: 'text-neon-cyan', border: 'border-neon-cyan/20', hoverBorder: 'hover:border-neon-cyan/50', hoverBg: 'group-hover:bg-neon-cyan', shadow: 'hover:shadow-[0_0_20px_hsl(180_100%_50%/0.15)]' },
  magenta: { bg: 'bg-neon-magenta/10', text: 'text-neon-magenta', border: 'border-neon-magenta/20', hoverBorder: 'hover:border-neon-magenta/50', hoverBg: 'group-hover:bg-neon-magenta', shadow: 'hover:shadow-[0_0_20px_hsl(300_100%_60%/0.15)]' },
  yellow: { bg: 'bg-neon-yellow/10', text: 'text-neon-yellow', border: 'border-neon-yellow/20', hoverBorder: 'hover:border-neon-yellow/50', hoverBg: 'group-hover:bg-neon-yellow', shadow: 'hover:shadow-[0_0_20px_hsl(50_100%_50%/0.15)]' },
  purple: { bg: 'bg-neon-purple/10', text: 'text-neon-purple', border: 'border-neon-purple/20', hoverBorder: 'hover:border-neon-purple/50', hoverBg: 'group-hover:bg-neon-purple', shadow: 'hover:shadow-[0_0_20px_hsl(280_100%_60%/0.15)]' },
  green: { bg: 'bg-neon-green/10', text: 'text-neon-green', border: 'border-neon-green/20', hoverBorder: 'hover:border-neon-green/50', hoverBg: 'group-hover:bg-neon-green', shadow: 'hover:shadow-[0_0_20px_hsl(150_100%_45%/0.15)]' },
  orange: { bg: 'bg-neon-orange/10', text: 'text-neon-orange', border: 'border-neon-orange/20', hoverBorder: 'hover:border-neon-orange/50', hoverBg: 'group-hover:bg-neon-orange', shadow: 'hover:shadow-[0_0_20px_hsl(25_100%_55%/0.15)]' },
};

const FeatureCard = ({ icon, title, description, color }: { icon: React.ReactNode; title: string; description: string; color: keyof typeof colorClasses }) => {
  const colors = colorClasses[color];
  return (
    <div className={`group bg-card/80 backdrop-blur-sm border ${colors.border} rounded-xl p-6 ${colors.hoverBorder} transition-all duration-300 ${colors.shadow}`}>
      <div className={`w-14 h-14 rounded-lg ${colors.bg} flex items-center justify-center ${colors.text} mb-4 ${colors.hoverBg} group-hover:text-background transition-all duration-300`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

export default Index;
