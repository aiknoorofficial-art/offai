import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import {
  Shield, Banknote, CheckCircle, XCircle, Package, Clock, MessageSquare,
  Users, BookOpen, Gift, TrendingUp, Trash2, UserPlus, UserMinus,
  Search, Send, LayoutDashboard, Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Withdrawal {
  id: string; user_id: string; amount: number; method: string;
  account_number: string; account_name: string; status: string;
  created_at: string; profile_name?: string;
}

interface OrderRow {
  id: string; message: string; status: string; created_at: string;
  buyer_id: string; course_id: string; seller_id: string;
  course_title: string; course_price: number;
  buyer_name: string; seller_name: string;
}

interface ProfileRow {
  user_id: string; full_name: string; created_at: string;
  referral_code: string | null; isAdmin: boolean;
}

interface CourseRow {
  id: string; title: string; price: number; user_id: string;
  created_at: string; image_url: string | null; seller_name: string;
}

interface ReferralRow {
  id: string; referrer_id: string; referred_id: string; status: string;
  commission_amount: number; created_at: string;
  referrer_name: string; referred_name: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);

  const [updating, setUpdating] = useState<string | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [courseSearch, setCourseSearch] = useState("");

  const [confirmDelete, setConfirmDelete] = useState<{ type: "course"; id: string; label: string } | null>(null);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyTarget, setNotifyTarget] = useState<ProfileRow | null>(null);
  const [notifyTitle, setNotifyTitle] = useState("");
  const [notifyMessage, setNotifyMessage] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) { navigate("/auth"); return; }
      setUser(session.user);

      const { data: roles } = await supabase
        .from("user_roles").select("role")
        .eq("user_id", session.user.id).eq("role", "admin");

      if (!roles || roles.length === 0) {
        toast.error("Access denied. Admins only.");
        navigate("/"); return;
      }
      setIsAdmin(true); setLoading(false);
      fetchAll();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) navigate("/auth");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchAll = () => {
    fetchWithdrawals(); fetchOrders(); fetchUsers(); fetchCourses(); fetchReferrals();
  };

  const fetchWithdrawals = async () => {
    const { data } = await supabase.from("withdrawals").select("*").order("created_at", { ascending: false });
    if (!data) return;
    const userIds = [...new Set(data.map(w => w.user_id))];
    const { data: profs } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
    const map = new Map((profs || []).map(p => [p.user_id, p.full_name]));
    setWithdrawals(data.map(w => ({ ...w, profile_name: map.get(w.user_id) || "Unknown" })));
  };

  const fetchOrders = async () => {
    const { data: ordersData } = await supabase.from("course_orders").select("*").order("created_at", { ascending: false });
    if (!ordersData) return;
    const courseIds = [...new Set(ordersData.map(o => o.course_id))];
    const userIds = [...new Set([...ordersData.map(o => o.buyer_id), ...ordersData.map(o => o.seller_id)])];
    const [{ data: cs }, { data: ps }] = await Promise.all([
      supabase.from("courses").select("id, title, price").in("id", courseIds),
      supabase.from("profiles").select("user_id, full_name").in("user_id", userIds),
    ]);
    const cm = Object.fromEntries((cs || []).map(c => [c.id, c]));
    const pm = Object.fromEntries((ps || []).map(p => [p.user_id, p]));
    setOrders(ordersData.map(o => ({
      id: o.id, message: o.message, status: o.status, created_at: o.created_at,
      buyer_id: o.buyer_id, course_id: o.course_id, seller_id: o.seller_id,
      course_title: cm[o.course_id]?.title || "Unknown",
      course_price: cm[o.course_id]?.price || 0,
      buyer_name: pm[o.buyer_id]?.full_name || "Anonymous",
      seller_name: pm[o.seller_id]?.full_name || "Unknown",
    })));
  };

  const fetchUsers = async () => {
    const { data: profs } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    const { data: roles } = await supabase.from("user_roles").select("user_id, role").eq("role", "admin");
    const adminSet = new Set((roles || []).map(r => r.user_id));
    setProfiles((profs || []).map(p => ({
      user_id: p.user_id, full_name: p.full_name, created_at: p.created_at,
      referral_code: p.referral_code, isAdmin: adminSet.has(p.user_id),
    })));
  };

  const fetchCourses = async () => {
    const { data } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
    if (!data) return;
    const userIds = [...new Set(data.map(c => c.user_id))];
    const { data: ps } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
    const pm = new Map((ps || []).map(p => [p.user_id, p.full_name]));
    setCourses(data.map(c => ({
      id: c.id, title: c.title, price: Number(c.price), user_id: c.user_id,
      created_at: c.created_at, image_url: c.image_url,
      seller_name: pm.get(c.user_id) || "Unknown",
    })));
  };

  const fetchReferrals = async () => {
    const { data } = await supabase.from("referrals").select("*").order("created_at", { ascending: false });
    if (!data) return;
    const userIds = [...new Set([...data.map(r => r.referrer_id), ...data.map(r => r.referred_id)])];
    const { data: ps } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
    const pm = new Map((ps || []).map(p => [p.user_id, p.full_name]));
    setReferrals(data.map(r => ({
      id: r.id, referrer_id: r.referrer_id, referred_id: r.referred_id,
      status: r.status, commission_amount: Number(r.commission_amount),
      created_at: r.created_at,
      referrer_name: pm.get(r.referrer_id) || "Unknown",
      referred_name: pm.get(r.referred_id) || "Unknown",
    })));
  };

  // ---- Actions ----
  const updateWithdrawalStatus = async (id: string, status: "approved" | "rejected") => {
    setUpdating(id);
    const { error } = await supabase.from("withdrawals").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success(`Withdrawal ${status}`); fetchWithdrawals(); }
    setUpdating(null);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrder(orderId);
    const { error } = await supabase.from("course_orders").update({ status: newStatus }).eq("id", orderId);
    if (error) { toast.error("Failed to update order"); }
    else {
      toast.success(`Order ${newStatus}!`);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (newStatus === "accepted") {
        const order = orders.find(o => o.id === orderId);
        if (order) {
          const { data: ref } = await supabase.from("referrals").select("*")
            .eq("referred_id", order.buyer_id).eq("status", "pending").maybeSingle();
          if (ref) {
            const commission = Math.round(order.course_price * 0.1);
            await supabase.from("referrals").update({
              status: "completed", commission_amount: commission, order_id: orderId,
            }).eq("id", ref.id);
          }
        }
      }
    }
    setUpdatingOrder(null);
  };

  const toggleAdminRole = async (target: ProfileRow) => {
    if (target.user_id === user?.id) { toast.error("You can't modify your own admin role"); return; }
    if (target.isAdmin) {
      const { error } = await supabase.from("user_roles").delete()
        .eq("user_id", target.user_id).eq("role", "admin");
      if (error) toast.error(error.message); else { toast.success(`Removed admin from ${target.full_name}`); fetchUsers(); }
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: target.user_id, role: "admin" });
      if (error) toast.error(error.message); else { toast.success(`${target.full_name} is now an admin`); fetchUsers(); }
    }
  };

  const deleteCourse = async (id: string) => {
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Course deleted"); fetchCourses(); }
    setConfirmDelete(null);
  };

  const sendNotification = async () => {
    if (!notifyTarget || !notifyTitle.trim() || !notifyMessage.trim()) {
      toast.error("Fill title and message"); return;
    }
    const { error } = await supabase.from("notifications").insert({
      user_id: notifyTarget.user_id, title: notifyTitle, message: notifyMessage, type: "admin",
    });
    if (error) toast.error(error.message);
    else {
      toast.success(`Notification sent to ${notifyTarget.full_name}`);
      setNotifyOpen(false); setNotifyTitle(""); setNotifyMessage(""); setNotifyTarget(null);
    }
  };

  // ---- Stats ----
  const stats = useMemo(() => {
    const totalRevenue = orders.filter(o => o.status === "accepted").reduce((s, o) => s + o.course_price, 0);
    const pendingPayouts = withdrawals.filter(w => w.status === "pending").reduce((s, w) => s + Number(w.amount), 0);
    return {
      users: profiles.length,
      courses: courses.length,
      pendingOrders: orders.filter(o => o.status === "pending").length,
      pendingWithdrawals: withdrawals.filter(w => w.status === "pending").length,
      revenue: totalRevenue,
      pendingPayouts,
      referrals: referrals.length,
      admins: profiles.filter(p => p.isAdmin).length,
    };
  }, [profiles, courses, orders, withdrawals, referrals]);

  const filteredUsers = profiles.filter(p =>
    p.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    p.referral_code?.toLowerCase().includes(userSearch.toLowerCase())
  );
  const filteredCourses = courses.filter(c =>
    c.title.toLowerCase().includes(courseSearch.toLowerCase()) ||
    c.seller_name.toLowerCase().includes(courseSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAdmin) return null;

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: "Pending", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    accepted: { label: "Accepted", color: "bg-green-500/20 text-green-400 border-green-500/30" },
    rejected: { label: "Rejected", color: "bg-red-500/20 text-red-400 border-red-500/30" },
    completed: { label: "Completed", color: "bg-green-500/20 text-green-400 border-green-500/30" },
    approved: { label: "Approved", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  };

  const StatCard = ({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string | number; accent: string }) => (
    <Card className="relative overflow-hidden border-border/50 hover:border-primary/40 transition-all group">
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${accent}`} />
      <CardContent className="p-4 sm:p-5 relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs sm:text-sm text-muted-foreground font-medium">{label}</span>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
        </div>
        <p className="text-xl sm:text-2xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="container mx-auto px-3 sm:px-4 pt-24 pb-16">
        <div className="max-w-7xl mx-auto">
          {/* Hero */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-neon-cyan/10 to-neon-magenta/10 border border-neon-cyan/20 text-neon-cyan text-xs sm:text-sm mb-3">
              <Shield className="w-4 h-4" /> Admin Control Center
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text-multi mb-2">
              Admin Dashboard
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Full platform control — manage users courses orders payouts and more
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
            <StatCard icon={Users} label="Total Users" value={stats.users} accent="from-neon-cyan/10 to-transparent" />
            <StatCard icon={BookOpen} label="Courses" value={stats.courses} accent="from-neon-magenta/10 to-transparent" />
            <StatCard icon={Activity} label="Pending Orders" value={stats.pendingOrders} accent="from-yellow-500/10 to-transparent" />
            <StatCard icon={Banknote} label="Pending Payouts" value={stats.pendingWithdrawals} accent="from-neon-orange/10 to-transparent" />
            <StatCard icon={TrendingUp} label="Revenue (Rs.)" value={stats.revenue.toLocaleString()} accent="from-green-500/10 to-transparent" />
            <StatCard icon={Banknote} label="Payout Queue (Rs.)" value={stats.pendingPayouts.toLocaleString()} accent="from-neon-orange/10 to-transparent" />
            <StatCard icon={Gift} label="Referrals" value={stats.referrals} accent="from-purple-500/10 to-transparent" />
            <StatCard icon={Shield} label="Admins" value={stats.admins} accent="from-neon-cyan/10 to-transparent" />
          </div>

          <Tabs defaultValue="orders" className="space-y-6">
            <TabsList className="w-full flex-wrap h-auto justify-start gap-1 bg-muted/40 p-1">
              <TabsTrigger value="orders" className="gap-2"><Package className="w-4 h-4" />Orders</TabsTrigger>
              <TabsTrigger value="withdrawals" className="gap-2"><Banknote className="w-4 h-4" />Payouts</TabsTrigger>
              <TabsTrigger value="users" className="gap-2"><Users className="w-4 h-4" />Users</TabsTrigger>
              <TabsTrigger value="courses" className="gap-2"><BookOpen className="w-4 h-4" />Courses</TabsTrigger>
              <TabsTrigger value="referrals" className="gap-2"><Gift className="w-4 h-4" />Referrals</TabsTrigger>
            </TabsList>

            {/* ORDERS */}
            <TabsContent value="orders" className="space-y-6">
              <SectionTitle icon={Activity} text={`Pending Orders (${orders.filter(o => o.status === "pending").length})`} />
              {orders.filter(o => o.status === "pending").length === 0 ? (
                <EmptyState text="No pending orders" />
              ) : (
                <div className="space-y-3">
                  {orders.filter(o => o.status === "pending").map((order) => (
                    <Card key={order.id} className="border-yellow-500/20 hover:border-yellow-500/40 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <CardTitle className="text-base sm:text-lg">{order.course_title}</CardTitle>
                          <Badge variant="outline" className={statusConfig.pending.color}>
                            <Clock className="w-3 h-3 mr-1" /> Pending
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                          <div><span className="text-muted-foreground text-xs">Buyer</span><p className="font-medium truncate">{order.buyer_name}</p></div>
                          <div><span className="text-muted-foreground text-xs">Seller</span><p className="font-medium truncate">{order.seller_name}</p></div>
                          <div><span className="text-muted-foreground text-xs">Price</span><p className="font-medium text-primary">Rs. {order.course_price}</p></div>
                          <div><span className="text-muted-foreground text-xs">Date</span><p className="font-medium">{new Date(order.created_at).toLocaleDateString()}</p></div>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3 flex gap-2 items-start">
                          <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <p className="text-sm whitespace-pre-wrap">{order.message}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => updateOrderStatus(order.id, "accepted")} disabled={updatingOrder === order.id} className="bg-green-600 hover:bg-green-700 text-white">
                            <CheckCircle className="w-4 h-4 mr-1" />Accept
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => updateOrderStatus(order.id, "rejected")} disabled={updatingOrder === order.id} className="border-red-500/50 text-red-400 hover:bg-red-500/10">
                            <XCircle className="w-4 h-4 mr-1" />Reject
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <SectionTitle icon={Package} text={`History (${orders.filter(o => o.status !== "pending").length})`} />
              <div className="space-y-2">
                {orders.filter(o => o.status !== "pending").map((order) => {
                  const cfg = statusConfig[order.status] || statusConfig.pending;
                  return (
                    <Card key={order.id} className="border-border/50">
                      <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{order.course_title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {order.buyer_name} → {order.seller_name} • Rs. {order.course_price}
                          </p>
                        </div>
                        <Badge variant="outline" className={cfg.color}>{cfg.label}</Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* WITHDRAWALS */}
            <TabsContent value="withdrawals" className="space-y-6">
              <SectionTitle icon={Banknote} text={`Pending Payouts (${withdrawals.filter(w => w.status === "pending").length})`} />
              <div className="space-y-2">
                {withdrawals.filter(w => w.status === "pending").length === 0 ? <EmptyState text="No pending withdrawals" /> : null}
                {withdrawals.filter(w => w.status === "pending").map((w) => (
                  <Card key={w.id} className="border-neon-orange/20">
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <Banknote className="w-5 h-5 text-neon-orange mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold">Rs. {Number(w.amount).toLocaleString()}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            {w.profile_name} • {w.method} • {w.account_name} • {w.account_number}
                          </p>
                          <p className="text-xs text-muted-foreground">{new Date(w.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" onClick={() => updateWithdrawalStatus(w.id, "approved")} disabled={updating === w.id} className="bg-green-600 hover:bg-green-700 text-white">
                          <CheckCircle className="w-4 h-4 mr-1" />Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => updateWithdrawalStatus(w.id, "rejected")} disabled={updating === w.id}>
                          <XCircle className="w-4 h-4 mr-1" />Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <SectionTitle icon={Banknote} text={`Processed (${withdrawals.filter(w => w.status !== "pending").length})`} />
              <div className="space-y-2">
                {withdrawals.filter(w => w.status !== "pending").map((w) => (
                  <Card key={w.id} className="border-border/50">
                    <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold">Rs. {Number(w.amount).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {w.profile_name} • {w.method} • {w.account_number}
                        </p>
                      </div>
                      <Badge variant="outline" className={(statusConfig[w.status] || statusConfig.pending).color}>
                        {w.status}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* USERS */}
            <TabsContent value="users" className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search by name or referral code..." value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                {filteredUsers.length === 0 ? <EmptyState text="No users found" /> : null}
                {filteredUsers.map((p) => (
                  <Card key={p.user_id} className="border-border/50 hover:border-primary/30 transition-colors">
                    <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-cyan to-neon-magenta flex items-center justify-center text-background font-bold shrink-0">
                          {p.full_name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold truncate">{p.full_name}</p>
                            {p.isAdmin && <Badge className="bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30 text-xs"><Shield className="w-3 h-3 mr-1" />Admin</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Ref: {p.referral_code || "—"} • Joined {new Date(p.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="outline" onClick={() => { setNotifyTarget(p); setNotifyOpen(true); }}>
                          <Send className="w-4 h-4 mr-1" />Notify
                        </Button>
                        <Button size="sm" variant={p.isAdmin ? "destructive" : "default"}
                          onClick={() => toggleAdminRole(p)} disabled={p.user_id === user?.id}>
                          {p.isAdmin ? <><UserMinus className="w-4 h-4 mr-1" />Demote</> : <><UserPlus className="w-4 h-4 mr-1" />Make Admin</>}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* COURSES */}
            <TabsContent value="courses" className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search by title or seller..." value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)} className="pl-9" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredCourses.length === 0 ? <EmptyState text="No courses found" /> : null}
                {filteredCourses.map((c) => (
                  <Card key={c.id} className="border-border/50 hover:border-primary/30 transition-colors">
                    <CardContent className="p-3 sm:p-4 flex gap-3">
                      {c.image_url ? (
                        <img src={c.image_url} alt={c.title} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <BookOpen className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{c.title}</p>
                        <p className="text-xs text-muted-foreground truncate">By {c.seller_name}</p>
                        <p className="text-sm text-primary font-bold mt-1">Rs. {c.price}</p>
                      </div>
                      <Button size="icon" variant="outline" className="shrink-0 border-red-500/50 text-red-400 hover:bg-red-500/10"
                        onClick={() => setConfirmDelete({ type: "course", id: c.id, label: c.title })}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* REFERRALS */}
            <TabsContent value="referrals" className="space-y-4">
              <SectionTitle icon={Gift} text={`All Referrals (${referrals.length})`} />
              <div className="space-y-2">
                {referrals.length === 0 ? <EmptyState text="No referrals yet" /> : null}
                {referrals.map((r) => {
                  const cfg = statusConfig[r.status] || statusConfig.pending;
                  return (
                    <Card key={r.id} className="border-border/50">
                      <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm">
                            <span className="text-neon-cyan">{r.referrer_name}</span> → <span className="text-neon-magenta">{r.referred_name}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Commission: Rs. {r.commission_amount} • {new Date(r.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline" className={cfg.color}>{cfg.label}</Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Confirm Delete */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this course?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmDelete?.label}" will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDelete && deleteCourse(confirmDelete.id)}
              className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send Notification */}
      <Dialog open={notifyOpen} onOpenChange={setNotifyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send notification to {notifyTarget?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Title" value={notifyTitle} onChange={(e) => setNotifyTitle(e.target.value)} />
            <Textarea placeholder="Message..." rows={4} value={notifyMessage} onChange={(e) => setNotifyMessage(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotifyOpen(false)}>Cancel</Button>
            <Button onClick={sendNotification}><Send className="w-4 h-4 mr-1" />Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const SectionTitle = ({ icon: Icon, text }: { icon: any; text: string }) => (
  <div className="flex items-center gap-2 mt-6">
    <Icon className="w-5 h-5 text-primary" />
    <h2 className="text-lg sm:text-xl font-semibold">{text}</h2>
  </div>
);

const EmptyState = ({ text }: { text: string }) => (
  <Card className="border-dashed border-border/50">
    <CardContent className="p-8 text-center text-muted-foreground text-sm">{text}</CardContent>
  </Card>
);

export default Admin;
