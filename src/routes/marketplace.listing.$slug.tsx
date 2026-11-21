import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Flag, ImageOff, MapPin } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ListingCard } from "@/components/marketplace/listing-card";
import { MarketplaceDisclaimer } from "@/components/marketplace/disclaimer";
import { RatingSummary, StarPicker } from "@/components/marketplace/stars";
import { UpgradeNotice } from "@/components/marketplace/pro-gate";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { listingQuery, mkCategoriesQuery } from "@/lib/marketplace.functions";
import { countryName } from "@/lib/marketplace/locations";
import { conditionLabel, formatPrice, typeLabel } from "@/lib/marketplace/shared";
import { breadcrumbLd, canonicalUrl, clampDescription, jsonLdScript, pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/marketplace/listing/$slug")({
  loader: async ({ context, params }) => {
    const [data, cats] = await Promise.all([
      context.queryClient.ensureQueryData(listingQuery(params.slug)),
      context.queryClient.ensureQueryData(mkCategoriesQuery),
    ]);
    if (!data) throw notFound();
    const cat = cats.find((c) => c.id === data.listing.category_id);
    return { data, category: cat ?? null };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "Listing unavailable — Welcome to HVAC" }, { name: "robots", content: "noindex" }] };
    const { data, category } = loaderData;
    const l = data.listing;
    const price = formatPrice(l.price, l.currency, l.listing_type);
    const title = `${l.title} — ${price} in ${l.city}, ${l.region} | Trades Marketplace`;
    const description = clampDescription(`${conditionLabel(l.condition)} ${category?.title ?? ""} in ${l.city}, ${l.region}, ${countryName(l.country)}. ${l.description}`);
    const path = `/marketplace/listing/${params.slug}`;
    const base = pageMeta({ title, description, path });
    const image = data.images[0];
    const shareImage = data.shareImage;
    const ld: Record<string, unknown> = {
      "@context": "https://schema.org", "@type": "Product", name: l.title, description: clampDescription(l.description, 500),
      ...(l.brand ? { brand: { "@type": "Brand", name: l.brand } } : {}), ...(l.model_number ? { mpn: l.model_number } : {}),
      ...(image ? { image } : {}), category: category?.title,
    };
    if (l.listing_type === "for_sale" && l.price > 0) {
      ld["offers"] = {
        "@type": "Offer", price: l.price.toFixed(2), priceCurrency: l.currency, url: canonicalUrl(path), availability: "https://schema.org/InStock",
        itemCondition: l.condition === "new" ? "https://schema.org/NewCondition" : l.condition === "refurbished" ? "https://schema.org/RefurbishedCondition" : l.condition === "for_parts" ? "https://schema.org/DamagedCondition" : "https://schema.org/UsedCondition",
      };
    }
    return {
      ...base,
      meta: [...base.meta.map((m) => ("property" in m && m.property === "og:type" ? { property: "og:type", content: "product" } : m)),
        ...(shareImage ? [
          { property: "og:image", content: shareImage },
          { property: "og:image:width", content: "1200" },
          { property: "og:image:height", content: "630" },
          { property: "og:image:alt", content: l.title },
          { name: "twitter:image", content: shareImage },
          { name: "twitter:image:alt", content: l.title },
        ] : [])],
      scripts: [jsonLdScript(ld), jsonLdScript(breadcrumbLd([
        { name: "Marketplace", path: "/marketplace" },
        ...(category ? [{ name: category.title, path: `/marketplace/c/${category.slug}` }] : []),
        { name: l.title, path },
      ]))],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">This listing is no longer available</h1>
      <p className="mt-2 text-sm text-muted-foreground">It may have sold or been removed by the seller.</p>
      <Button asChild className="mt-6"><Link to="/marketplace">Browse the marketplace</Link></Button>
    </div>
  ),
  errorComponent: () => <p className="p-8 text-sm text-muted-foreground">This listing didn't load. Please refresh.</p>,
  component: ListingPage,
});

function ListingPage() {
  const { slug } = Route.useParams();
  const { category } = Route.useLoaderData();
  const { data } = useSuspenseQuery(listingQuery(slug));
  const { data: cats } = useSuspenseQuery(mkCategoriesQuery);
  const [active, setActive] = useState(0);
  if (!data) return null;
  const l = data.listing;
  const parent = category?.parent_id ? cats.find((c) => c.id === category.parent_id) : null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap gap-1 text-xs text-muted-foreground">
        <Link to="/marketplace" className="hover:text-foreground">Marketplace</Link>
        {parent ? <><span>/</span><Link to="/marketplace/c/$slug" params={{ slug: parent.slug }} className="hover:text-foreground">{parent.title}</Link></> : null}
        {category ? <><span>/</span><Link to="/marketplace/c/$slug" params={{ slug: category.slug }} className="hover:text-foreground">{category.title}</Link></> : null}
      </nav>
      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <div className="aspect-[4/3] overflow-hidden rounded-xl border bg-muted">
            {data.images[active] ? (
              <img src={data.images[active]} alt={`${l.title} — photo ${active + 1}`} decoding="async" className="h-full w-full object-contain" />
            ) : <div className="flex h-full items-center justify-center text-muted-foreground"><ImageOff className="h-8 w-8" /></div>}
          </div>
          {data.images.length > 1 ? (
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {data.images.map((src, i) => (
                <button key={src} type="button" onClick={() => setActive(i)} aria-label={`Show photo ${i + 1}`}
                  className={`h-16 w-20 shrink-0 overflow-hidden rounded border ${i === active ? "ring-2 ring-primary" : ""}`}>
                  <img src={src} alt={`${l.title} thumbnail ${i + 1}`} loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
          <section className="mt-8">
            <h2 className="text-base font-semibold">Description</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-6">{l.description}</p>
            {l.specs ? <><h2 className="mt-6 text-base font-semibold">Specifications</h2><p className="mt-2 whitespace-pre-line text-sm leading-6">{l.specs}</p></> : null}
          </section>
        </div>
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{l.title}</h1>
            <p className="mt-2 text-xl font-semibold">{formatPrice(l.price, l.currency, l.listing_type)}{l.negotiable && l.listing_type === "for_sale" ? <span className="ml-2 text-sm font-normal text-muted-foreground">Negotiable</span> : null}</p>
            <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{l.city}, {l.region}, {countryName(l.country)}</p>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border bg-card p-4 text-sm">
            <dt className="text-muted-foreground">Condition</dt><dd>{conditionLabel(l.condition)}</dd>
            <dt className="text-muted-foreground">Type</dt><dd>{typeLabel(l.listing_type)}</dd>
            {category ? <><dt className="text-muted-foreground">Category</dt><dd>{category.title}</dd></> : null}
            {l.brand ? <><dt className="text-muted-foreground">Brand</dt><dd>{l.brand}</dd></> : null}
            {l.model_number ? <><dt className="text-muted-foreground">Model</dt><dd>{l.model_number}</dd></> : null}
            {l.approx_age ? <><dt className="text-muted-foreground">Approx. age</dt><dd>{l.approx_age}</dd></> : null}
            <dt className="text-muted-foreground">Handoff</dt><dd>{[l.pickup && "Pickup", l.delivery && "Delivery"].filter(Boolean).join(" or ") || "Ask seller"}</dd>
            <dt className="text-muted-foreground">Posted</dt><dd>{new Date(l.created_at).toLocaleDateString("en-CA", { dateStyle: "medium" })}</dd>
          </dl>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm font-semibold">Seller: {data.seller.name}</p>
            <RatingSummary avg={data.seller.rating_avg} count={data.seller.rating_count} className="mt-1" />
          </div>
          <ContactSeller listingId={l.id} sellerId={l.seller_id} />
          <RateSeller listingId={l.id} sellerId={l.seller_id} />
          <ReportListing listingId={l.id} />
          <MarketplaceDisclaimer withProhibited />
        </div>
      </div>
      {data.related.length ? (
        <section className="mt-12">
          <h2 className="text-base font-semibold">Related listings</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {data.related.map((r) => <ListingCard key={r.id} item={r} categoryTitle={cats.find((c) => c.id === r.category_id)?.title} />)}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ContactSeller({ listingId, sellerId }: { listingId: string; sellerId: string }) {
  const { user, isPro } = useAuth();
  const [show, setShow] = useState(false);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: existing, refetch } = useQuery({
    queryKey: ["mk", "conv-for", listingId, user?.id],
    enabled: !!user && user.id !== sellerId,
    queryFn: async () => (await supabase.from("marketplace_conversations").select("id").eq("listing_id", listingId).eq("buyer_id", user!.id).maybeSingle()).data,
  });
  if (user?.id === sellerId) return <Button asChild variant="outline" className="w-full"><Link to="/marketplace/mine">Manage your listing</Link></Button>;
  if (!show) return <Button className="w-full" onClick={() => setShow(true)}>Contact Seller</Button>;
  if (!isPro) return <UpgradeNotice />;
  if (existing) return <Button asChild className="w-full"><Link to="/marketplace/messages" search={{ c: existing.id }}>Open your conversation</Link></Button>;

  const send = async () => {
    const text = body.trim();
    if (text.length < 2) return void toast.error("Write a short message first.");
    setBusy(true);
    const { data: conv, error } = await supabase.from("marketplace_conversations")
      .insert({ listing_id: listingId, buyer_id: user!.id, seller_id: sellerId }).select("id").single();
    if (error || !conv) { setBusy(false); return void toast.error("Couldn't start the conversation. Make sure your Pro membership is active."); }
    const { error: mErr } = await supabase.from("marketplace_messages").insert({ conversation_id: conv.id, sender_id: user!.id, body: text.slice(0, 2000) });
    setBusy(false);
    if (mErr) return void toast.error(mErr.message.includes("too quickly") ? mErr.message : "Message failed to send.");
    toast.success("Message sent to the seller.");
    void refetch();
  };
  return (
    <div className="space-y-2 rounded-lg border bg-card p-4">
      <label htmlFor="mk-msg" className="text-sm font-medium">Message the seller</label>
      <Textarea id="mk-msg" rows={4} maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Hi, is this still available?" />
      <p className="text-xs text-muted-foreground">Don't share personal financial details. Meet in a public place when exchanging items.</p>
      <Button onClick={send} disabled={busy} className="w-full">{busy ? "Sending…" : "Send message"}</Button>
    </div>
  );
}

function RateSeller({ listingId, sellerId }: { listingId: string; sellerId: string }) {
  const { user, isPro } = useAuth();
  const enabled = !!user && isPro && user.id !== sellerId;
  const { data, refetch } = useQuery({
    queryKey: ["mk", "rating", listingId, user?.id],
    enabled,
    queryFn: async () => {
      const [{ data: can }, { data: mine }] = await Promise.all([
        supabase.rpc("marketplace_can_rate", { _rater: user!.id, _listing: listingId }),
        supabase.from("marketplace_ratings").select("id, stars").eq("listing_id", listingId).eq("rater_id", user!.id).maybeSingle(),
      ]);
      return { can: !!can, mine };
    },
  });
  if (!enabled || !data?.can) return null;
  const rate = async (stars: number) => {
    const { error } = data.mine
      ? await supabase.from("marketplace_ratings").update({ stars }).eq("id", data.mine.id)
      : await supabase.from("marketplace_ratings").insert({ listing_id: listingId, seller_id: sellerId, rater_id: user!.id, stars });
    if (error) return void toast.error("Couldn't save your rating.");
    toast.success("Rating saved.");
    void refetch();
  };
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm font-medium">{data.mine ? "Your rating (you can change it)" : "Rate this seller"}</p>
      <StarPicker value={data.mine?.stars ?? 0} onChange={rate} />
    </div>
  );
}

const REASONS = [
  ["prohibited", "Prohibited or regulated item"], ["stolen", "Possibly stolen"], ["scam", "Scam or fraud"],
  ["unsafe", "Unsafe product"], ["spam", "Spam"], ["wrong_category", "Wrong category"], ["other", "Other"],
] as const;

function ReportListing({ listingId }: { listingId: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("prohibited");
  const [details, setDetails] = useState("");
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><Flag className="h-3.5 w-3.5" />Report listing</button>;
  if (!user) return <p className="text-xs text-muted-foreground"><Link to="/auth" className="underline">Sign in</Link> to report a listing.</p>;
  const submit = async () => {
    const { error } = await supabase.from("marketplace_reports").insert({ listing_id: listingId, reporter_id: user.id, reason, details: details.trim().slice(0, 1000) || null });
    if (error) return void toast.error(error.code === "23505" ? "You've already reported this listing." : "Report failed.");
    toast.success("Thanks — an administrator will review it.");
    setOpen(false);
  };
  return (
    <div className="space-y-2 rounded-lg border bg-card p-4">
      <select aria-label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
        {REASONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <Textarea rows={2} maxLength={1000} placeholder="Optional details" value={details} onChange={(e) => setDetails(e.target.value)} />
      <div className="flex gap-2"><Button size="sm" onClick={submit}>Send report</Button><Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button></div>
    </div>
  );
}
