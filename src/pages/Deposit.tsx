import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { useAuthUser } from "@/hooks/useAuthUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Copy, Upload, Wallet, ShieldCheck } from "lucide-react";
import { money, StatusBadge } from "@/lib/campaignUi";
import { Link } from "react-router-dom";

interface Method {
  id: string; key: string; name: string; account_label: string; account_value: string;
  account_holder: string | null; currency: string; min_amount: number; instructions: string | null;
}
interface DepositRow {
  id: string; amount: number; currency: string; method_name: string; status: string;
  rejection_reason: string | null; created_at: string;
}

const Deposit = () => {
  const { user } = useAuthUser();
  const [methods, setMethods] = useState<Method[]>([]);
  const [methodId, setMethodId] = useState("");
  const [amount, setAmount] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderAccount, setSenderAccount] = useState("");
  const [txId, setTxId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<DepositRow[]>([]);

  const method = methods.find((m) => m.id === methodId);

  const loadHistory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("deposits").select("id,amount,currency,method_name,status,rejection_reason,created_at")
      .eq("user_id", user.id).order("created_at", { ascending: false });
    setHistory((data ?? []) as DepositRow[]);
  };

  useEffect(() => {
    supabase.from("deposit_methods").select("*").eq("is_active", true).order("sort_order")
      .then(({ data }) => setMethods((data ?? []) as Method[]));
  }, []);
  useEffect(() => { loadHistory(); }, [user]);

  const submit = async () => {
    if (!user || !method) return toast.error("Select a deposit method");
    const value = Number(amount);
    if (!value || value <= 0) return toast.error("Enter a valid amount");
    if (value < Number(method.min_amount))
      return toast.error(`Minimum deposit is ${money(method.min_amount, method.currency)}`);
    if (!file) return toast.error("Upload your payment screenshot");

    setSubmitting(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("deposit-proofs").upload(path, file);
      if (upErr) throw upErr;

      const { error } = await supabase.from("deposits").insert({
        user_id: user.id, method_id: method.id, method_key: method.key, method_name: method.name,
        amount: value, currency: method.currency, sender_name: senderName.trim() || null,
        sender_account: senderAccount.trim() || null, transaction_id: txId.trim() || null,
        proof_path: path, status: "pending",
      });
      if (error) throw error;

      toast.success("Deposit submitted — pending approval");
      setAmount(""); setSenderName(""); setSenderAccount(""); setTxId(""); setFile(null);
      loadHistory();
    } catch (e: any) {
      toast.error(e.message || "Could not submit deposit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-4xl">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-3">
            <Wallet className="w-4 h-4" /> Deposit
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Add funds</h1>
          <p className="text-muted-foreground mt-2">
            Every deposit is reviewed by an admin before it is approved.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader><CardTitle className="text-lg">1. Choose a payment method</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {methods.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethodId(m.id)}
                className={`rounded-xl border p-4 text-left transition-all ${
                  methodId === m.id ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <p className="font-semibold text-foreground">{m.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum {money(m.min_amount, m.currency)}
                </p>
              </button>
            ))}
          </CardContent>
        </Card>

        {method && (
          <Card className="mb-8">
            <CardHeader><CardTitle className="text-lg">2. Send your payment</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-border p-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{method.account_label}</p>
                    <p className="font-mono text-base text-foreground break-all">{method.account_value}</p>
                  </div>
                  <Button
                    size="sm" variant="outline" className="gap-1.5 shrink-0"
                    onClick={() => { navigator.clipboard.writeText(method.account_value); toast.success("Copied"); }}
                  >
                    <Copy className="w-4 h-4" /> Copy
                  </Button>
                </div>
                {method.account_holder && (
                  <p className="text-sm text-muted-foreground">Account holder: {method.account_holder}</p>
                )}
                <p className="text-sm text-primary">Minimum deposit: {money(method.min_amount, method.currency)}</p>
                {method.instructions && <p className="text-xs text-muted-foreground">{method.instructions}</p>}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-10">
          <CardHeader><CardTitle className="text-lg">3. Submit your proof</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Amount {method ? `(${method.currency})` : ""}</Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="20" />
              </div>
              <div className="space-y-2">
                <Label>Transaction ID</Label>
                <Input value={txId} onChange={(e) => setTxId(e.target.value)} placeholder="TX123456" />
              </div>
              <div className="space-y-2">
                <Label>Sender name</Label>
                <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Sender account</Label>
                <Input value={senderAccount} onChange={(e) => setSenderAccount(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Payment screenshot</Label>
              <Input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              Deposits are never approved automatically. An admin will review your proof and you will be notified.
            </div>
            <Button onClick={submit} disabled={submitting} className="w-full sm:w-auto gap-2">
              <Upload className="w-4 h-4" /> {submitting ? "Submitting..." : "Submit deposit request"}
            </Button>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Deposit history</h2>
          <Link to="/dashboard" className="text-sm text-primary hover:underline">Go to dashboard</Link>
        </div>
        {history.length === 0 ? (
          <p className="text-muted-foreground">No deposits yet.</p>
        ) : (
          <div className="space-y-3">
            {history.map((d) => (
              <div key={d.id} className="rounded-xl border border-border p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{money(d.amount, d.currency)} · {d.method_name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleString()}</p>
                  {d.status === "rejected" && d.rejection_reason && (
                    <p className="text-xs text-destructive mt-1">Reason: {d.rejection_reason}</p>
                  )}
                </div>
                <StatusBadge status={d.status} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Deposit;
