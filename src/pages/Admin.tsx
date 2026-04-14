import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Shield, Banknote, CheckCircle, XCircle, Package, Clock, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface OrderWithDetails {
  id: string;
  message: string;
  status: string;
  created_at: string;
  buyer_id: string;
  course_id: string;
  seller_id: string;
  course_title: string;
  course_price: number;
  buyer_name: string;
  seller_name: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) { navigate("/auth"); return; }
      setUser(session.user);

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
      fetchOrders();
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

    if (error) { console.error(error); return; }

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((w) => w.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) || []);
      setWithdrawals(data.map((w) => ({ ...w, profile_name: profileMap.get(w.user_id) || "Unknown" })));
    } else {
      setWithdrawals([]);
    }
  };

  const fetchOrders = async () => {
    const { data: ordersData, error } = await supabase
      .from("course_orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !ordersData) { console.error(error); return; }

    const courseIds = [...new Set(ordersData.map((o) => o.course_id))];
    const userIds = [...new Set([...ordersData.map((o) => o.buyer_id), ...ordersData.map((o) => o.seller_id)])];

    const [{ data: courses }, { data: profiles }] = await Promise.all([
      supabase.from("courses").select("id, title, price").in("id", courseIds),
      supabase.from("profiles").select("user_id, full_name").in("user_id", userIds),
    ]);

    const courseMap = Object.fromEntries((courses || []).map((c) => [c.id, c]));
    const profileMap = Object.fromEntries((profiles || []).map((p) => [p.user_id, p]));

    setOrders(ordersData.map((o) => ({
      id: o.id,
      message: o.message,
      status: o.status,
      created_at: o.created_at,
      buyer_id: o.buyer_id,
      course_id: o.course_id,
      seller_id: o.seller_id,
      course_title: courseMap[o.course_id]?.title || "Unknown Course",
      course_price: courseMap[o.course_id]?.price || 0,
      buyer_name: profileMap[o.buyer_id]?.full_name || "Anonymous",
      seller_name: profileMap[o.seller_id]?.full_name || "Unknown Seller",
    })));
  };

  const updateWithdrawalStatus = async (id: string, status: "approved" | "rejected") => {
    setUpdating(id);
    const { error } = await supabase.from("withdrawals").update({ status }).eq("id", id);
    if (error) toast.error("Failed to update: " + error.message);
    else { toast.success(`Withdrawal ${status}`); fetchWithdrawals(); }
    setUpdating(null);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrder(orderId);
    const { error } = await supabase
      .from("course_orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to update order status");
    } else {
      toast.success(`Order ${newStatus}!`);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));

      if (newStatus === "accepted") {
        const order = orders.find(o => o.id === orderId);
        if (order) {
          try {
            const { data: referral } = await supabase
              .from("referrals")
              .select("*")
              .eq("referred_id", order.buyer_id)
              .eq("status", "pending")
              .maybeSingle();

            if (referral) {
              const commission = Math.round(order.course_price * 0.1);
              await supabase.from("referrals").update({
                status: "completed",
                commission_amount: commission,
                order_id: orderId,
              }).eq("id", referral.id);
            }
          } catch (e) {
            console.error("Referral commission error:", e);
          }
        }
      }
    }
    setUpdatingOrder(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending");
  const processedWithdrawals = withdrawals.filter((w) => w.status !== "pending");
  const pendingOrders = orders.filter((o) => o.status === "pending");
  const processedOrders = orders.filter((o) => o.status !== "pending");

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: "Pending", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    accepted: { label: "Accepted (Unlocked)", color: "bg-green-500/20 text-green-400 border-green-500/30" },
    rejected: { label: "Rejected (Locked)", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  };

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
            Admin Dashboard
          </h1>

          <Tabs defaultValue="orders" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="orders" className="gap-2">
                <Package className="w-4 h-4" />
                Orders ({pendingOrders.length} pending)
              </TabsTrigger>
              <TabsTrigger value="withdrawals" className="gap-2">
                <Banknote className="w-4 h-4" />
                Withdrawals ({pendingWithdrawals.length} pending)
              </TabsTrigger>
            </TabsList>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-6">
              <h2 className="text-xl font-semibold text-foreground">
                Pending Orders ({pendingOrders.length})
              </h2>
              {pendingOrders.length === 0 ? (
                <p className="text-muted-foreground">No pending orders.</p>
              ) : (
                <div className="space-y-4">
                  {pendingOrders.map((order) => (
                    <Card key={order.id} className="border-yellow-500/20">
                      <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <CardTitle className="text-lg text-foreground">{order.course_title}</CardTitle>
                          <Badge variant="outline" className={statusConfig.pending.color}>
                            <Clock className="w-3 h-3 mr-1" />
                            {statusConfig.pending.label}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Buyer:</span>
                            <p className="font-medium text-foreground">{order.buyer_name}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Seller:</span>
                            <p className="font-medium text-foreground">{order.seller_name}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Price:</span>
                            <p className="font-medium text-primary">Rs. {order.course_price}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Date:</span>
                            <p className="font-medium text-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <div className="bg-muted/30 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                            <p className="text-sm text-foreground whitespace-pre-wrap">{order.message}</p>
                          </div>
                        </div>

                        <div className="flex gap-3 pt-1">
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, "accepted")}
                            disabled={updatingOrder === order.id}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Accept & Unlock
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateOrderStatus(order.id, "rejected")}
                            disabled={updatingOrder === order.id}
                            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject & Lock
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <h2 className="text-xl font-semibold text-foreground mt-8">
                Processed Orders ({processedOrders.length})
              </h2>
              {processedOrders.length === 0 ? (
                <p className="text-muted-foreground">No processed orders yet.</p>
              ) : (
                <div className="space-y-3">
                  {processedOrders.map((order) => {
                    const config = statusConfig[order.status] || statusConfig.pending;
                    return (
                      <Card key={order.id} className="border-border/50">
                        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold">{order.course_title}</p>
                            <p className="text-sm text-muted-foreground">
                              Buyer: {order.buyer_name} • Seller: {order.seller_name} • Rs. {order.course_price}
                            </p>
                            <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                          </div>
                          <Badge variant="outline" className={config.color}>
                            {config.label}
                          </Badge>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Withdrawals Tab */}
            <TabsContent value="withdrawals" className="space-y-6">
              <h2 className="text-xl font-semibold text-foreground">
                Pending ({pendingWithdrawals.length})
              </h2>
              {pendingWithdrawals.length === 0 ? (
                <p className="text-muted-foreground">No pending requests.</p>
              ) : (
                <div className="space-y-3">
                  {pendingWithdrawals.map((w) => (
                    <Card key={w.id} className="border-neon-yellow/20">
                      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <Banknote className="w-5 h-5 text-neon-orange mt-0.5" />
                          <div>
                            <p className="font-semibold">Rs. {Number(w.amount).toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">
                              {w.profile_name} • {w.method} • {w.account_name} • {w.account_number}
                            </p>
                            <p className="text-xs text-muted-foreground">{new Date(w.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => updateWithdrawalStatus(w.id, "approved")} disabled={updating === w.id} variant="outline" className="bg-neon-green/20 text-neon-green border-neon-green/30 hover:bg-neon-green/30 gap-1">
                            <CheckCircle className="w-4 h-4" /> Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => updateWithdrawalStatus(w.id, "rejected")} disabled={updating === w.id} className="gap-1">
                            <XCircle className="w-4 h-4" /> Reject
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <h2 className="text-xl font-semibold text-foreground mt-8">
                Processed ({processedWithdrawals.length})
              </h2>
              {processedWithdrawals.length === 0 ? (
                <p className="text-muted-foreground">No processed requests yet.</p>
              ) : (
                <div className="space-y-3">
                  {processedWithdrawals.map((w) => (
                    <Card key={w.id} className="border-border/50">
                      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <Banknote className="w-5 h-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-semibold">Rs. {Number(w.amount).toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">
                              {w.profile_name} • {w.method} • {w.account_name} • {w.account_number}
                            </p>
                            <p className="text-xs text-muted-foreground">{new Date(w.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                        <Badge variant={w.status === "approved" ? "default" : "destructive"} className={w.status === "approved" ? "bg-neon-green/20 text-neon-green border-neon-green/30" : ""}>
                          {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Admin;
