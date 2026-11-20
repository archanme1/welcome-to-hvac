import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketplaceSubnav } from "@/components/marketplace/subnav";
import { ProOnly } from "@/components/marketplace/pro-gate";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatPrice, type ListingStatus } from "@/lib/marketplace/shared";

export const Route = createFileRoute("/marketplace/mine")({
  ssr: false,
  head: () => ({ meta: [{ title: "My Listings — Trades Marketplace" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <MarketplaceSubnav />
      <h1 className="mb-6 text-2xl font-bold tracking-tight">My Listings</h1>
      <ProOnly message="Managing listings is part of HVAC Pro. Upgrade to WelcomeToHVAC Pro to post and manage marketplace listings."><Mine /></ProOnly>
    </div>
  ),
});

const TABS: { value: ListingStatus; label: string }[] = [
  { value: "active", label: "Active" }, { value: "sold", label: "Sold" },
  { value: "unavailable", label: "Unavailable" }, { value: "draft", label: "Drafts" }, { value: "removed", label: "Removed" },
];

function Mine() {
  const { user } = useAuth();
  const [tab, setTab] = useState<ListingStatus>("active");
  const { data, refetch, isLoading } = useQuery({
    queryKey: ["mk", "mine", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("marketplace_listings")
      .select("id, slug, title, price, currency, listing_type, status, city, region, updated_at")
      .eq("seller_id", user!.id).order("updated_at", { ascending: false })).data ?? [],
  });
  const rows = (data ?? []).filter((r) => r.status === tab);

  const setStatus = async (id: string, status: ListingStatus) => {
    const { error } = await supabase.from("marketplace_listings").update({ status }).eq("id", id);
    if (error) return void toast.error("Couldn't update the listing.");
    toast.success("Listing updated.");
    void refetch();
  };
  const remove = async (id: string) => {
    if (!window.confirm("Delete this listing permanently? This can't be undone.")) return;
    const { data: imgs } = await supabase.from("marketplace_listing_images").select("path").eq("listing_id", id);
    const { error } = await supabase.from("marketplace_listings").delete().eq("id", id);
    if (error) return void toast.error("Couldn't delete the listing.");
    if (imgs?.length) await supabase.storage.from("marketplace").remove(imgs.map((i) => i.path));
    toast.success("Listing deleted.");
    void refetch();
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Tabs value={tab} onValueChange={(v) => setTab(v as ListingStatus)}>
          <TabsList>{TABS.map((t) => <TabsTrigger key={t.value} value={t.value}>{t.label} ({(data ?? []).filter((r) => r.status === t.value).length})</TabsTrigger>)}</TabsList>
        </Tabs>
        <Button asChild size="sm"><Link to="/marketplace/new">Post a listing</Link></Button>
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : rows.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">Nothing here yet.</div>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {r.status === "active" ? <Link to="/marketplace/listing/$slug" params={{ slug: r.slug }} className="text-sm font-semibold hover:underline">{r.title}</Link> : <p className="text-sm font-semibold">{r.title}</p>}
                <p className="text-xs text-muted-foreground">{formatPrice(Number(r.price), r.currency, r.listing_type)} · {r.city}, {r.region} · updated {new Date(r.updated_at).toLocaleDateString("en-CA")}</p>
                {r.status === "removed" ? <p className="mt-1 text-xs text-destructive">Removed by a moderator. Contact support if you think this is a mistake.</p> : null}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {r.status !== "removed" ? <Button asChild size="sm" variant="outline"><Link to="/marketplace/edit/$id" params={{ id: r.id }}>Edit</Link></Button> : null}
                {r.status === "active" ? <>
                  <Button size="sm" variant="outline" onClick={() => void setStatus(r.id, "sold")}>Mark sold</Button>
                  <Button size="sm" variant="outline" onClick={() => void setStatus(r.id, "unavailable")}>Mark unavailable</Button>
                </> : null}
                {r.status === "sold" || r.status === "unavailable" ? <Button size="sm" variant="outline" onClick={() => void setStatus(r.id, "active")}>Reactivate</Button> : null}
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => void remove(r.id)}>Delete</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
