import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Ban, Check, Clock, Copy, Landmark, ShieldOff } from "lucide-react";

const PLANS = [
  { id: "15h", label: "Block within 15 hours", price: 3500, eta: "Fastest" },
  { id: "1d", label: "Block within 1 day", price: 2000, eta: "Recommended" },
  { id: "3d", label: "Block within 3 days", price: 1800, eta: "Standard" },
  { id: "7d", label: "Block within 1 week", price: 1550, eta: "Economy" },
];

const PAYMENT_ACCOUNTS = [
  { id: "easypaisa", name: "Easypaisa", holder: "Fazal ur Rehman", number: "03343558055", color: "bg-green-500" },
  { id: "jazzcash", name: "JazzCash", holder: "Fazal ur Rehman", number: "03343558055", color: "bg-red-500" },
];

const detailsSchema = z.object({
  target_number: z.string().trim().min(7, "Enter a valid number").max(20, "Too long"),
  target_name: z.string().trim().min(1, "Name required").max(80, "Too long"),
  comment: z.string().trim().max(500, "Max 500 chars").optional(),
});

const BlockWhatsApp = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [step, setStep] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [targetNumber, setTargetNumber] = useState("");
  const [targetName, setTargetName] = useState("");
  const [comment, setComment] = useState("");
  const [planId, setPlanId] = useState(PLANS[1].id);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const plan = PLANS.find((p) => p.id === planId)!;

  const handleNextDetails = () => {
    const parsed = detailsSchema.safeParse({ target_number: targetNumber, target_name: targetName, comment });
    if (!parsed.success) {
      toast({ title: "Check your details", description: Object.values(parsed.error.flatten().fieldErrors).flat()[0], variant: "destructive" });
      return;
    }
    setStep(2);
  };

  const handleCopy = (num: string, id: string) => {
    navigator.clipboard.writeText(num);
    setCopiedId(id);
    toast({ title: "Copied", description: "Account number copied" });
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleSubmit = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("whatsapp_block_requests").insert({
      user_id: user.id,
      target_number: targetNumber.trim(),
      target_name: targetName.trim(),
      comment: comment.trim() || null,
      plan: plan.label,
      amount_pkr: plan.price,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Request submitted", description: "We'll review your block request after payment confirmation." });
    setStep(4);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header user={user} />
      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-magenta to-neon-purple shadow-[0_0_30px_hsl(var(--neon-magenta)/0.5)] mb-4">
              <ShieldOff className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-glow mb-2">Block a WhatsApp Number</h1>
            <p className="text-muted-foreground">Submit a block request &amp; complete payment to get started.</p>
          </div>

          {/* Stepper */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${step >= s ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_hsl(var(--primary)/0.6)]" : "border-border text-muted-foreground"}`}>
                  {step > s ? <Check className="w-4 h-4" /> : s}
                </div>
                {s < 3 && <div className={`w-12 h-0.5 ${step > s ? "bg-primary" : "bg-border"}`} />}
              </div>
            ))}
          </div>

          <Card className="p-6 md:p-8 border-primary/20 bg-card/50 backdrop-blur">
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-2xl font-bold flex items-center gap-2"><Ban className="w-6 h-6 text-neon-magenta" /> Target Details</h2>
                <div className="space-y-2">
                  <Label htmlFor="num">WhatsApp Number to Block *</Label>
                  <Input id="num" placeholder="+92 300 1234567" value={targetNumber} onChange={(e) => setTargetNumber(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" placeholder="Owner / contact name" value={targetName} onChange={(e) => setTargetName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comment">Comment (optional)</Label>
                  <Textarea id="comment" placeholder="Any extra info that helps us..." value={comment} onChange={(e) => setComment(e.target.value)} rows={4} />
                </div>
                <div className="flex justify-end">
                  <Button variant="glow" onClick={handleNextDetails} className="gap-2">
                    Next <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-2xl font-bold flex items-center gap-2"><Clock className="w-6 h-6 text-neon-cyan" /> Choose a Plan</h2>
                <RadioGroup value={planId} onValueChange={setPlanId} className="grid gap-3">
                  {PLANS.map((p) => (
                    <Label key={p.id} htmlFor={p.id} className={`flex items-center justify-between gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${planId === p.id ? "border-primary bg-primary/5 shadow-[0_0_20px_hsl(var(--primary)/0.3)]" : "border-border hover:border-primary/50"}`}>
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={p.id} id={p.id} />
                        <div>
                          <div className="font-semibold">{p.label}</div>
                          <Badge variant="secondary" className="mt-1">{p.eta}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{p.price.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">PKR</div>
                      </div>
                    </Label>
                  ))}
                </RadioGroup>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)} className="gap-2"><ArrowLeft className="w-4 h-4" /> Back</Button>
                  <Button variant="glow" onClick={() => setStep(3)} className="gap-2">Next <ArrowRight className="w-4 h-4" /></Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <h2 className="text-2xl font-bold flex items-center gap-2"><Smartphone className="w-6 h-6 text-neon-orange" /> Transfer Payment</h2>
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Amount to pay</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{plan.label}</div>
                  </div>
                  <div className="text-3xl font-bold text-primary">{plan.price.toLocaleString()} <span className="text-sm">PKR</span></div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Send the exact amount to any of the accounts below:</p>
                  {PAYMENT_ACCOUNTS.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-background/50">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${a.color} flex items-center justify-center text-white font-bold`}>
                          {a.name[0]}
                        </div>
                        <div>
                          <div className="font-semibold">{a.name}</div>
                          <div className="text-xs text-muted-foreground">{a.holder}</div>
                          <div className="text-sm font-mono">{a.number}</div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleCopy(a.number, a.id)} className="gap-2">
                        {copiedId === a.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copiedId === a.id ? "Copied" : "Copy"}
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="text-xs text-muted-foreground p-3 rounded-md bg-muted/30 border border-border">
                  After sending the payment, click "Submit Request". Our team will verify the transfer and begin the block process within your chosen timeframe.
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)} className="gap-2"><ArrowLeft className="w-4 h-4" /> Back</Button>
                  <Button variant="glow" onClick={handleSubmit} disabled={submitting} className="gap-2">
                    {submitting ? "Submitting..." : "Submit Request"} <Check className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="text-center py-8 space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
                  <Check className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold">Request Submitted!</h2>
                <p className="text-muted-foreground">We will verify your payment and start processing your block request shortly.</p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => navigate("/")}>Back to Home</Button>
                  <Button variant="glow" onClick={() => { setStep(1); setTargetName(""); setTargetNumber(""); setComment(""); }}>New Request</Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BlockWhatsApp;
