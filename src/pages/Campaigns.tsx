import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { useAuthUser } from "@/hooks/useAuthUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Check, Megaphone, Plus, Trash2 } from "lucide-react";
import { platformIcon, StatusBadge } from "@/lib/campaignUi";

interface Platform { id: string; key: string; name: string }
interface BadgeRow { id: string; name: string; description: string | null; daily_requirement: string; daily_target: number }
interface Campaign {
  id: string; title: string; description: string | null; platform_keys: string[];
  badge_id: string | null; start_date: string; end_date: string;
  daily_status: string; daily_progress: number; status: string;
}

const today = () => new Date().toISOString().slice(0, 10);
const inWeek = () => new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);

const Campaigns = () => {
  const { user } = useAuthUser();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [badges, setBadges] = useState<BadgeRow[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [badgeId, setBadgeId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState(inWeek());
  const [saving, setSaving] = useState(false);

  const loadCampaigns = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("campaigns").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setCampaigns((data ?? []) as Campaign[]);
  };

  useEffect(() => {
    supabase.from("campaign_platforms").select("id,key,name").eq("is_active", true)
      .order("sort_order").then(({ data }) => setPlatforms((data ?? []) as Platform[]));
    supabase.from("daily_badges").select("id,name,description,daily_requirement,daily_target")
      .eq("is_active", true).order("sort_order")
      .then(({ data }) => setBadges((data ?? []) as BadgeRow[]));
  }, []);

  useEffect(() => { loadCampaigns(); }, [user]);

  const toggle = (key: string) =>
    setSelected((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key]));

  const createCampaign = async () => {
    if (!user) return;
    if (!title.trim()) return toast.error("Add a campaign name");
    if (!selected.length) return toast.error("Select at least one platform");
    if (!badgeId) return toast.error("Select a daily badge");
    if (endDate < startDate) return toast.error("End date must be after the start date");

    setSaving(true);
    const { error } = await supabase.from("campaigns").insert({
      user_id: user.id, title: title.trim(), description: description.trim() || null,
      platform_keys: selected, badge_id: badgeId, start_date: startDate, end_date: endDate,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Campaign created");
    setTitle(""); setDescription(""); setSelected([]); setBadgeId("");
    loadCampaigns();
  };

  const updateDaily = async (c: Campaign, status: string) => {
    const badge = badges.find((b) => b.id === c.badge_id);
    const progress = status === "completed" ? 100 : status === "active" ? Math.max(c.daily_progress, 10) : 0;
    const { error } = await supabase.from("campaigns")
      .update({ daily_status: status, daily_progress: progress }).eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success(badge ? `${badge.name} marked ${status}` : `Marked ${status}`);
    loadCampaigns();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("campaigns").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Campaign removed");
    loadCampaigns();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-5xl">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-3">
            <Megaphone className="w-4 h-4" /> Campaign Manager
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Create a campaign</h1>
          <p className="text-muted-foreground mt-2">Pick your platforms, choose a daily badge and track progress.</p>
        </div>

        <Card className="mb-10">
          <CardHeader><CardTitle className="text-lg">Campaign details</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Campaign name</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Summer promo" />
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short note" />
              </div>
              <div className="space-y-2">
                <Label>Start date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End date</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Platforms (select one or more)</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {platforms.map((p) => {
                  const on = selected.includes(p.key);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggle(p.key)}
                      className={`relative flex items-center gap-2 rounded-xl border p-3 text-left transition-all ${
                        on ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card hover:border-primary/40"
                      }`}
                    >
                      {platformIcon(p.key)}
                      <span className="text-sm font-medium">{p.name}</span>
                      {on && (
                        <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Daily badge</Label>
              <div className="grid gap-3 sm:grid-cols-3">
                {badges.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBadgeId(b.id)}
                    className={`rounded-xl border p-4 text-left transition-all ${
                      badgeId === b.id ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <p className="font-semibold text-foreground">{b.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{b.daily_requirement}</p>
                    <p className="text-xs text-primary mt-2">Daily target: {b.daily_target}</p>
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={createCampaign} disabled={saving} className="w-full sm:w-auto gap-2">
              <Plus className="w-4 h-4" /> {saving ? "Creating..." : "Create campaign"}
            </Button>
          </CardContent>
        </Card>

        <h2 className="text-xl font-semibold text-foreground mb-4">My campaigns</h2>
        {campaigns.length === 0 ? (
          <p className="text-muted-foreground">No campaigns yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {campaigns.map((c) => {
              const badge = badges.find((b) => b.id === c.badge_id);
              return (
                <Card key={c.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-base">{c.title}</CardTitle>
                      <StatusBadge status={c.daily_status} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {c.description && <p className="text-sm text-muted-foreground">{c.description}</p>}
                    <div className="flex flex-wrap gap-2">
                      {c.platform_keys.map((k) => (
                        <span key={k} className="flex items-center gap-1.5 text-xs rounded-full border border-border px-2.5 py-1">
                          {platformIcon(k, "w-3.5 h-3.5")} {k}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {badge ? `${badge.name} · ${badge.daily_requirement}` : "No badge"}
                    </p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Daily progress</span><span>{c.daily_progress}%</span>
                      </div>
                      <Progress value={c.daily_progress} />
                    </div>
                    <p className="text-xs text-muted-foreground">{c.start_date} → {c.end_date}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => updateDaily(c, "active")}>Start today</Button>
                      <Button size="sm" variant="outline" onClick={() => updateDaily(c, "completed")}>Mark completed</Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(c.id)} className="text-destructive gap-1">
                        <Trash2 className="w-4 h-4" /> Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Campaigns;
