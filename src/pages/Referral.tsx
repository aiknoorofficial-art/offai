import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Share2, Users, DollarSign, Link2, CheckCircle, Clock, Gift } from "lucide-react";

interface Referral {
  id: string;
  referred_id: string;
  commission_amount: number;
  status: string;
  created_at: string;
}

const Referral = () => {
  const [user, setUser] = useState<User | null>(null);
  const [referralCode, setReferralCode] = useState("");
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchReferralData(session.user.id);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchReferralData(session.user.id);
      else setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchReferralData = async (userId: string) => {
    setLoading(true);
    const [profileRes, referralsRes] = await Promise.all([
      supabase.from("profiles").select("referral_code").eq("user_id", userId).maybeSingle(),
      supabase.from("referrals").select("*").eq("referrer_id", userId).order("created_at", { ascending: false }),
    ]);
    if (profileRes.data?.referral_code) setReferralCode(profileRes.data.referral_code);
    if (referralsRes.data) setReferrals(referralsRes.data);
    setLoading(false);
  };

  const referralLink = `${window.location.origin}/auth?mode=signup&ref=${referralCode}`;
  const totalEarned = referrals.filter(r => r.status === "completed").reduce((s, r) => s + Number(r.commission_amount), 0);
  const totalReferred = referrals.length;
  const completedReferrals = referrals.filter(r => r.status === "completed").length;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied!");
  };

  const shareLink = async () => {
    if (navigator.share) {
      await navigator.share({ title: "Join OFF AI", text: "Sign up using my referral link and get started!", url: referralLink });
    } else {
      copyLink();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={user} />
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
              <Gift className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Referral Program</h1>
            <p className="text-muted-foreground">Share your link and earn commission on every first order</p>
          </div>

          {/* Referral Link Card */}
          <Card className="mb-6 border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-primary" />
                Your Referral Link
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 bg-background/80 rounded-lg px-4 py-3 font-mono text-sm border border-border truncate">
                  {referralCode ? referralLink : "Loading..."}
                </div>
                <div className="flex gap-2">
                  <Button onClick={copyLink} variant="outline" className="gap-2">
                    <Copy className="w-4 h-4" /> Copy
                  </Button>
                  <Button onClick={shareLink} variant="glow" className="gap-2">
                    <Share2 className="w-4 h-4" /> Share
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                When someone signs up with your link and their first order is accepted you earn 10% commission
              </p>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="text-3xl font-bold text-foreground">{totalReferred}</div>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="text-3xl font-bold text-foreground">{completedReferrals}</div>
                <p className="text-sm text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <DollarSign className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="text-3xl font-bold text-foreground">PKR {totalEarned.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Commission Earned</p>
              </CardContent>
            </Card>
          </div>

          {/* Referral History */}
          <Card>
            <CardHeader>
              <CardTitle>Referral History</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground text-center py-8">Loading...</p>
              ) : referrals.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">No referrals yet - share your link to get started!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {referrals.map((ref) => (
                    <div key={ref.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Referred User</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(ref.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {ref.commission_amount > 0 && (
                          <span className="text-sm font-bold text-primary">
                            PKR {Number(ref.commission_amount).toLocaleString()}
                          </span>
                        )}
                        <Badge variant={ref.status === "completed" ? "default" : "secondary"}>
                          {ref.status === "completed" ? (
                            <><CheckCircle className="w-3 h-3 mr-1" /> Completed</>
                          ) : (
                            <><Clock className="w-3 h-3 mr-1" /> Pending</>
                          )}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Referral;
