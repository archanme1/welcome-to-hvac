import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { draftTradeFact } from "@/lib/trade-facts.functions";

export const Route = createFileRoute("/admin/trade-facts")({ component: Page });

type Fact = {
  id: string; headline: string; explanation: string; example: string | null; category: string;
  learn_more_href: string | null; learn_more_label: string | null; scheduled_date: string | null;
  month: number | null; status: string; source_note: string | null;
};
const CATS = ["HVAC", "Air Conditioning", "Heat Pumps", "Refrigeration", "Electrical", "Building Science", "Airflow", "Ventilation", "Heating", "Combustion", "HVAC Fundamentals", "Mechanical Engineering", "Renewable Energy", "Plumbing", "Skilled Trades"];
const blank: Omit<Fact, "id"> = { headline: "", explanation: "", example: "", category: "HVAC", learn_more_href: "", learn_more_label: "", scheduled_date: null, month: null, status: "draft", source_note: "" };
const sel = "h-9 w-full rounded-md border border-input bg-background px-2 text-sm";

function Page() {
  const { isStaff } = useAuth();
  const qc = useQueryClient();
  const draft = useServerFn(draftTradeFact);
  const { data: facts } = useQuery({
    queryKey: ["admin", "trade-facts"], enabled: isStaff,
    queryFn: async () => {
      const { data, error } = await supabase.from("trade_facts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Fact[];
    },
  });
  const [editing, setEditing] = useState<(Omit<Fact, "id"> & { id?: string }) | null>(null);
  const [filter, setFilter] = useState("all");
  const [aiTopic, setAiTopic] = useState("");
  const [aiCat, setAiCat] = useState("HVAC");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!editing) return;
    if (!editing.headline.trim() || !editing.explanation.trim()) { toast.error("Headline and explanation are required."); return; }
    const row = { ...editing, example: editing.example || null, learn_more_href: editing.learn_more_href || null, learn_more_label: editing.learn_more_label || null, source_note: editing.source_note || null, scheduled_date: editing.scheduled_date || null, month: editing.month || null };
    const { id, ...rest } = row;
    const { error } = id ? await supabase.from("trade_facts").update(rest).eq("id", id) : await supabase.from("trade_facts").insert(rest);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved.");
    setEditing(null);
    await qc.invalidateQueries({ queryKey: ["admin", "trade-facts"] });
    await qc.invalidateQueries({ queryKey: ["todays-fact"] });
  };
  const setStatus = async (f: Fact, status: string) => {
    const { error } = await supabase.from("trade_facts").update({ status }).eq("id", f.id);
    if (error) { toast.error(error.message); return; }
    await qc.invalidateQueries({ queryKey: ["admin", "trade-facts"] });
  };
  const runAi = async () => {
    setBusy(true);
    try { await draft({ data: { topic: aiTopic, category: aiCat } }); toast.success("Draft created — review and verify before approving."); setAiTopic(""); await qc.invalidateQueries({ queryKey: ["admin", "trade-facts"] }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "AI draft failed."); }
    finally { setBusy(false); }
  };

  const list = (facts ?? []).filter((f) => filter === "all" || f.status === filter);

  return (
    <div className="space-y-6">
      <ShopUrlSetting enabled={isStaff} />

      <section className="rounded-lg border bg-card p-5">
        <h2 className="text-sm font-semibold">Draft a fact with AI</h2>
        <p className="mt-1 text-xs text-muted-foreground">Creates a draft only. Verify technical claims against reliable sources before approving.</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input placeholder="Topic, e.g. why heat pumps defrost" value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} />
          <select className={`${sel} sm:w-48`} value={aiCat} onChange={(e) => setAiCat(e.target.value)}>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
          <Button size="sm" disabled={busy || aiTopic.trim().length < 3} onClick={() => void runAi()}>{busy ? "Drafting…" : "Draft"}</Button>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <select className={`${sel} w-40`} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option><option value="draft">Drafts</option><option value="approved">Approved</option><option value="disabled">Disabled</option>
        </select>
        <Button size="sm" onClick={() => setEditing({ ...blank })}>New fact</Button>
      </div>

      {editing ? (
        <section className="space-y-3 rounded-lg border bg-card p-5">
          <div className="space-y-1.5"><Label>Headline</Label><Input value={editing.headline} onChange={(e) => setEditing({ ...editing, headline: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Explanation</Label><Textarea rows={3} value={editing.explanation} onChange={(e) => setEditing({ ...editing, explanation: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Practical example / surprising detail</Label><Textarea rows={2} value={editing.example ?? ""} onChange={(e) => setEditing({ ...editing, example: e.target.value })} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Category</Label><select className={sel} value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></div>
            <div className="space-y-1.5"><Label>Status</Label><select className={sel} value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}><option value="draft">Draft</option><option value="approved">Approved</option><option value="disabled">Disabled</option></select></div>
            <div className="space-y-1.5"><Label>Learn more link (site path)</Label><Input placeholder="/calculators/superheat" value={editing.learn_more_href ?? ""} onChange={(e) => setEditing({ ...editing, learn_more_href: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Link label</Label><Input value={editing.learn_more_label ?? ""} onChange={(e) => setEditing({ ...editing, learn_more_label: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Schedule for date (optional)</Label><Input type="date" value={editing.scheduled_date ?? ""} onChange={(e) => setEditing({ ...editing, scheduled_date: e.target.value || null })} /></div>
            <div className="space-y-1.5"><Label>Seasonal month (optional)</Label><select className={sel} value={editing.month ?? ""} onChange={(e) => setEditing({ ...editing, month: e.target.value ? Number(e.target.value) : null })}><option value="">Any month</option>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{new Date(2026, i, 1).toLocaleString("en", { month: "long" })}</option>)}</select></div>
          </div>
          <div className="space-y-1.5"><Label>Source / verification note</Label><Input value={editing.source_note ?? ""} onChange={(e) => setEditing({ ...editing, source_note: e.target.value })} /></div>
          <div className="flex gap-2"><Button size="sm" onClick={() => void save()}>Save</Button><Button size="sm" variant="outline" onClick={() => setEditing(null)}>Cancel</Button></div>
        </section>
      ) : null}

      <div className="divide-y rounded-lg border bg-card">
        {list.map((f) => (
          <div key={f.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{f.headline}</p>
              <p className="text-xs text-muted-foreground">{f.category} · {f.status}{f.scheduled_date ? ` · scheduled ${f.scheduled_date}` : ""}{f.month ? ` · month ${f.month}` : ""}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              {f.status !== "approved" ? <Button size="sm" variant="outline" onClick={() => void setStatus(f, "approved")}>Approve</Button> : <Button size="sm" variant="outline" onClick={() => void setStatus(f, "disabled")}>Disable</Button>}
              <Button size="sm" variant="ghost" onClick={() => setEditing({ ...f })}>Edit</Button>
            </div>
          </div>
        ))}
        {list.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No facts.</p> : null}
      </div>
    </div>
  );
}

function ShopUrlSetting({ enabled }: { enabled: boolean }) {
  const [url, setUrl] = useState("");
  const qc = useQueryClient();
  useEffect(() => {
    if (!enabled) return;
    void supabase.from("app_settings").select("value").eq("key", "shop_url").maybeSingle().then(({ data }) => setUrl(typeof data?.value === "string" ? data.value : "https://store.welcometohvac.com/"));
  }, [enabled]);
  const save = async () => {
    if (!/^https:\/\/[^\s]+$/.test(url)) { toast.error("Enter a full https:// address."); return; }
    const { error } = await supabase.from("app_settings").upsert({ key: "shop_url", value: url });
    if (error) { toast.error("Only administrators can change the store link."); return; }
    toast.success("Store link saved.");
    await qc.invalidateQueries({ queryKey: ["shop-url"] });
  };
  return (
    <section className="rounded-lg border bg-card p-5">
      <h2 className="text-sm font-semibold">Shop link</h2>
      <p className="mt-1 text-xs text-muted-foreground">Where the "Visit Our Store" button sends visitors.</p>
      <div className="mt-3 flex gap-2"><Input value={url} onChange={(e) => setUrl(e.target.value)} /><Button size="sm" onClick={() => void save()}>Save</Button></div>
    </section>
  );
}
