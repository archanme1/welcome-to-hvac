import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/marketplace")({
  head: () => ({ meta: [{ title: "Marketplace moderation — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminMarketplace,
});

function AdminMarketplace() {
  return (
    <div className="space-y-10">
      <Reports />
      <Listings />
      <Categories />
    </div>
  );
}

function Reports() {
  const { data, refetch } = useQuery({
    queryKey: ["admin", "mk-reports"],
    queryFn: async () => (await supabase.from("marketplace_reports")
      .select("id, reason, details, status, created_at, listing_id, listing:marketplace_listings(title, slug, status)")
      .eq("status", "open").order("created_at", { ascending: false }).limit(200)).data ?? [],
  });
  const act = async (reportId: string, listingId: string, remove: boolean) => {
    if (remove) {
      const { error } = await supabase.from("marketplace_listings").update({ status: "removed" }).eq("id", listingId);
      if (error) return void toast.error("Couldn't remove the listing.");
    }
    await supabase.from("marketplace_reports").update({ status: remove ? "resolved" : "dismissed" }).eq("id", reportId);
    toast.success(remove ? "Listing removed." : "Report dismissed.");
    void refetch();
  };
  return (
    <section>
      <h2 className="text-lg font-semibold">Open reports</h2>
      {!data?.length ? <p className="mt-2 text-sm text-muted-foreground">No open reports.</p> : (
        <ul className="mt-3 divide-y rounded-lg border bg-card">
          {data.map((r) => {
            const l = r.listing as unknown as { title: string; slug: string; status: string } | null;
            return (
              <li key={r.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm">
                  <p className="font-medium">{l?.title ?? "(deleted)"} <span className="text-xs text-muted-foreground">· {l?.status}</span></p>
                  <p className="text-xs text-muted-foreground">{r.reason.replace("_", " ")}{r.details ? ` — ${r.details}` : ""}</p>
                </div>
                <div className="flex gap-1.5">
                  {l?.status === "active" ? <Button asChild size="sm" variant="outline"><Link to="/marketplace/listing/$slug" params={{ slug: l.slug }} target="_blank">View</Link></Button> : null}
                  <Button size="sm" variant="destructive" onClick={() => void act(r.id, r.listing_id, true)}>Remove listing</Button>
                  <Button size="sm" variant="ghost" onClick={() => void act(r.id, r.listing_id, false)}>Dismiss</Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Listings() {
  const [q, setQ] = useState("");
  const { data, refetch } = useQuery({
    queryKey: ["admin", "mk-listings", q],
    queryFn: async () => {
      let query = supabase.from("marketplace_listings").select("id, slug, title, status, city, region, created_at").order("created_at", { ascending: false }).limit(50);
      if (q.trim()) query = query.ilike("title", `%${q.trim()}%`);
      return (await query).data ?? [];
    },
  });
  const setStatus = async (id: string, status: "removed" | "active") => {
    const { error } = await supabase.from("marketplace_listings").update({ status }).eq("id", id);
    if (error) return void toast.error("Update failed.");
    void refetch();
  };
  return (
    <section>
      <h2 className="text-lg font-semibold">Recent listings</h2>
      <Input className="mt-2 max-w-sm" placeholder="Search titles…" value={q} onChange={(e) => setQ(e.target.value)} />
      <ul className="mt-3 divide-y rounded-lg border bg-card">
        {(data ?? []).map((l) => (
          <li key={l.id} className="flex items-center justify-between gap-2 p-3 text-sm">
            <div><p className="font-medium">{l.title}</p><p className="text-xs text-muted-foreground">{l.status} · {l.city}, {l.region} · {new Date(l.created_at).toLocaleDateString("en-CA")}</p></div>
            {l.status === "removed"
              ? <Button size="sm" variant="outline" onClick={() => void setStatus(l.id, "active")}>Restore</Button>
              : <Button size="sm" variant="ghost" className="text-destructive" onClick={() => void setStatus(l.id, "removed")}>Remove</Button>}
          </li>
        ))}
        {!data?.length ? <li className="p-3 text-sm text-muted-foreground">No listings.</li> : null}
      </ul>
    </section>
  );
}

function Categories() {
  const [title, setTitle] = useState("");
  const [parent, setParent] = useState("");
  const { data, refetch } = useQuery({
    queryKey: ["admin", "mk-cats"],
    queryFn: async () => (await supabase.from("marketplace_categories").select("id, slug, title, parent_id, is_active, sort_order").order("sort_order")).data ?? [],
  });
  const parents = (data ?? []).filter((c) => !c.parent_id);
  const add = async () => {
    const t = title.trim();
    if (t.length < 2) return;
    const slug = t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if ((data ?? []).some((c) => c.slug === slug || c.title.toLowerCase() === t.toLowerCase() && c.parent_id === (parent || null))) return void toast.error("That category already exists.");
    const { error } = await supabase.from("marketplace_categories").insert({ title: t, slug, parent_id: parent || null, sort_order: 100 });
    if (error) return void toast.error(error.code === "23505" ? "That category already exists." : "Couldn't add the category.");
    setTitle("");
    void refetch();
  };
  const toggle = async (id: string, is_active: boolean) => { await supabase.from("marketplace_categories").update({ is_active }).eq("id", id); void refetch(); };
  return (
    <section>
      <h2 className="text-lg font-semibold">Categories</h2>
      <div className="mt-2 flex flex-wrap gap-2">
        <Input className="max-w-xs" placeholder="New category name" value={title} onChange={(e) => setTitle(e.target.value)} />
        <select value={parent} onChange={(e) => setParent(e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
          <option value="">Top-level trade</option>
          {parents.map((p) => <option key={p.id} value={p.id}>Under {p.title}</option>)}
        </select>
        <Button size="sm" onClick={add}>Add</Button>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {parents.map((p) => (
          <div key={p.id} className="rounded-lg border bg-card p-3 text-sm">
            <CatRow c={p} onToggle={toggle} bold />
            {(data ?? []).filter((c) => c.parent_id === p.id).map((c) => <CatRow key={c.id} c={c} onToggle={toggle} />)}
          </div>
        ))}
      </div>
    </section>
  );
}

function CatRow({ c, onToggle, bold }: { c: { id: string; title: string; is_active: boolean }; onToggle: (id: string, v: boolean) => void; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className={`${bold ? "font-semibold" : "pl-3"} ${c.is_active ? "" : "text-muted-foreground line-through"}`}>{c.title}</span>
      <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => onToggle(c.id, !c.is_active)}>{c.is_active ? "Hide" : "Show"}</button>
    </div>
  );
}
