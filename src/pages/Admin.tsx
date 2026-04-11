import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Shield, Banknote, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  method: string;
  account_number: string;
  account_name: string;
  status: string;
  created_at: string;
  profile_name?: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        navigate("/auth");
        return;
      }
      setUser(session.user);

      // Check admin role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin");

      if (!roles || roles.length === 0) {
        toast.error("Access denied. Admins only.");
        navigate("/");
        return;
      }

      setIsAdmin(true);
      setLoading(false);
      fetchWithdrawals();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) navigate("/auth");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchWithdrawals = async () => {
    const { data, error } = await supabase
      .from("withdrawals")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((w) => w.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) || []);

      setWithdrawals(
        data.map((w) => ({ ...w, profile_name: profileMap.get(w.user_id) || "Unknown" }))
      );
    } else {
      setWithdrawals([]);
    }
  };

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    setUpdating(id);
    const { error } = await supabase
      .from("withdrawals")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update: " + error.message);
    } else {
      toast.success(`Withdrawal ${status}`);
      fetchWithdrawals();
    }
    setUpdating(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  const pending = withdrawals.filter((w) => w.status === "pending");
  const processed = withdrawals.filter((w) => w.status !== "pending");

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-neon-cyan/10 to-neon-magenta/10 border border-neon-cyan/20 text-neon-cyan text-sm mb-4">
            <Shield className="w-4 h-4" />
            Admin Panel
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold gradient-text-multi mb-8">
            Withdrawal Requests
          </h1>

          {/* Pending */}
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Pending ({pending.length})
          </h2>
          {pending.length === 0 ? (
            <p className="text-muted-foreground mb-8">No pending requests.</p>
          ) : (
            <div className="space-y-3 mb-8">
              {pending.map((w) => (
                <Card key={w.id} className="border-neon-yellow/20">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Banknote className="w-5 h-5 text-neon-orange mt-0.5" />
                      <div>
                        <p className="font-semibold">Rs. {Number(w.amount).toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {w.profile_name} • {w.method} • {w.account_name} • {w.account_number}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(w.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateStatus(w.id, "approved")}
                        disabled={updating === w.id}
                        className="bg-neon-green/20 text-neon-green border border-neon-green/30 hover:bg-neon-green/30 gap-1"
                        variant="outline"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateStatus(w.id, "rejected")}
                        disabled={updating === w.id}
                        className="gap-1"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Processed */}
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Processed ({processed.length})
          </h2>
          {processed.length === 0 ? (
            <p className="text-muted-foreground">No processed requests yet.</p>
          ) : (
            <div className="space-y-3">
              {processed.map((w) => (
                <Card key={w.id} className="border-border/50">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Banknote className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-semibold">Rs. {Number(w.amount).toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {w.profile_name} • {w.method} • {w.account_name} • {w.account_number}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(w.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={w.status === "approved" ? "default" : "destructive"}
                      className={w.status === "approved" ? "bg-neon-green/20 text-neon-green border-neon-green/30" : ""}
                    >
                      {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin;
