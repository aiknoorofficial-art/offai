import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Package, Clock, CheckCircle, XCircle, MessageSquare, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface OrderWithCourse {
  id: string;
  message: string;
  status: string;
  created_at: string;
  buyer_id: string;
  course_id: string;
  course_title: string;
  course_price: number;
  buyer_name: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: <Clock className="w-4 h-4" /> },
  accepted: { label: "Accepted", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: <CheckCircle className="w-4 h-4" /> },
  rejected: { label: "Rejected", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: <XCircle className="w-4 h-4" /> },
};

const Orders = () => {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<OrderWithCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) fetchOrders(data.user.id);
    });
  }, []);

  const fetchOrders = async (userId: string) => {
    setLoading(true);
    const { data: ordersData, error } = await supabase
      .from("course_orders")
      .select("*")
      .eq("seller_id", userId)
      .order("created_at", { ascending: false });

    if (error || !ordersData) {
      setLoading(false);
      return;
    }

    const courseIds = [...new Set(ordersData.map((o) => o.course_id))];
    const buyerIds = [...new Set(ordersData.map((o) => o.buyer_id))];

    const [{ data: courses }, { data: profiles }] = await Promise.all([
      supabase.from("courses").select("id, title, price").in("id", courseIds),
      supabase.from("profiles").select("user_id, full_name").in("user_id", buyerIds),
    ]);

    const courseMap = Object.fromEntries((courses || []).map((c) => [c.id, c]));
    const profileMap = Object.fromEntries((profiles || []).map((p) => [p.user_id, p]));

    const enriched: OrderWithCourse[] = ordersData.map((o) => ({
      id: o.id,
      message: o.message,
      status: o.status,
      created_at: o.created_at,
      buyer_id: o.buyer_id,
      course_id: o.course_id,
      course_title: courseMap[o.course_id]?.title || "Unknown Course",
      course_price: courseMap[o.course_id]?.price || 0,
      buyer_name: profileMap[o.buyer_id]?.full_name || "Anonymous",
    }));

    setOrders(enriched);
    setLoading(false);
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    const { error } = await supabase
      .from("course_orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to update order status");
    } else {
      toast.success(`Order ${newStatus}!`);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    }
    setUpdatingId(null);
  };

  const pendingCount = orders.filter((o) => o.status === "pending").length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={user} />
      <main className="flex-1 container mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/courses">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
              <Package className="w-7 h-7 text-primary" />
              My Orders
            </h1>
            <p className="text-muted-foreground mt-1">
              {pendingCount > 0
                ? `You have ${pendingCount} pending order${pendingCount > 1 ? "s" : ""}`
                : "Manage your incoming course orders"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <Card className="border-border/50 bg-card/50">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No orders yet</h3>
              <p className="text-muted-foreground">
                When someone orders your course, it will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => {
              const config = statusConfig[order.status] || statusConfig.pending;
              return (
                <Card key={order.id} className="border-border/50 bg-card/50 hover:border-primary/30 transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <CardTitle className="text-lg text-foreground">
                        {order.course_title}
                      </CardTitle>
                      <Badge variant="outline" className={`${config.color} flex items-center gap-1.5 w-fit`}>
                        {config.icon}
                        {config.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Buyer:</span>
                        <p className="font-medium text-foreground">{order.buyer_name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Price:</span>
                        <p className="font-medium text-primary">Rs. {order.course_price}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Date:</span>
                        <p className="font-medium text-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="bg-muted/30 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <p className="text-sm text-foreground">{order.message}</p>
                      </div>
                    </div>

                    {order.status === "pending" && (
                      <div className="flex gap-3 pt-1">
                        <Button
                          size="sm"
                          onClick={() => updateStatus(order.id, "accepted")}
                          disabled={updatingId === order.id}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(order.id, "rejected")}
                          disabled={updatingId === order.id}
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Orders;
