import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CountrySelect } from "@/components/marketplace/country-select";
import { RegionInput } from "@/components/marketplace/region-input";
import { ListingCard } from "@/components/marketplace/listing-card";
import { MarketplaceDisclaimer } from "@/components/marketplace/disclaimer";
import { MarketplaceSubnav } from "@/components/marketplace/subnav";
import { useCountryPref } from "@/hooks/use-country-pref";
import { mkCategoriesQuery, searchListingsQuery, type MkCategory } from "@/lib/marketplace.functions";
import { CONDITIONS, LISTING_TYPES, SORTS, exploreSearchSchema, type ExploreSearch } from "@/lib/marketplace/shared";
import { breadcrumbLd, jsonLdScript, pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/marketplace/")({
  validateSearch: (s) => exploreSearchSchema.parse(s),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    const cats = await context.queryClient.ensureQueryData(mkCategoriesQuery);
    const categoryId = deps.category ? cats.find((c) => c.slug === deps.category)?.id ?? null : null;
    await context.queryClient.ensureQueryData(searchListingsQuery({ ...deps, categoryId }));
  },
  head: ({ match }) => {
    const filtered = Object.values(match.search ?? {}).some((v) => v !== undefined);
    const base = pageMeta({
      title: "Trades Marketplace — Used HVAC Equipment, Tools & Parts | Welcome to HVAC",
      description: "Browse new and used HVAC equipment, refrigeration parts, electrical and plumbing tools, and construction gear listed by trades professionals. Free to browse.",
      path: "/marketplace",
    });
    return {
      ...base,
      meta: [...base.meta, ...(filtered ? [{ name: "robots", content: "noindex, follow" }] : [])],
      scripts: [jsonLdScript(breadcrumbLd([{ name: "Home", path: "/" }, { name: "Marketplace", path: "/marketplace" }]))],
    };
  },
  errorComponent: () => <p className="p-8 text-sm text-muted-foreground">The marketplace didn't load. Please refresh.</p>,
  component: Explore,
});

function Explore() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/marketplace/" });
  const { data: cats } = useSuspenseQuery(mkCategoriesQuery);
  const categoryId = search.category ? cats.find((c) => c.slug === search.category)?.id ?? null : null;
  const { data } = useQuery({ ...searchListingsQuery({ ...search, categoryId }), placeholderData: (p) => p });
  const pref = useCountryPref();
  const applied = useRef(false);

  // Apply the remembered country once, when the visitor arrives without one in the URL.
  useEffect(() => {
    if (!pref.ready || applied.current) return;
    applied.current = true;
    if (!search.country && pref.country && Object.keys(search).length === 0) {
      void navigate({ search: { country: pref.country }, replace: true });
    }
  }, [pref.ready, pref.country, search, navigate]);

  const set = (patch: Partial<ExploreSearch>) => void navigate({ search: (prev) => ({ ...prev, ...patch, page: undefined }) });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <MarketplaceSubnav />
      <h1 className="text-3xl font-bold tracking-tight">Trades Marketplace</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        New and used tools, equipment, parts and materials from people across the trades. Browsing is free; HVAC Pro members can post listings and contact sellers.
      </p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <Filters search={search} cats={cats} set={set} onCountry={(c) => { void pref.save(c ?? null); set({ country: c, region: undefined }); }} />
        <div>
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">{data ? `${data.total} listing${data.total === 1 ? "" : "s"}` : "Loading…"}</p>
            <select aria-label="Sort" value={search.sort ?? "newest"} onChange={(e) => set({ sort: e.target.value as ExploreSearch["sort"] })}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm">
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          {data && data.items.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {data.items.map((item) => (
                <ListingCard key={item.id} item={item} seller={data.sellers[item.seller_id]} categoryTitle={cats.find((c) => c.id === item.category_id)?.title} />
              ))}
            </div>
          ) : data ? (
            <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">No listings match yet. Try clearing a filter.</div>
          ) : null}
          {data && data.total > data.page * data.pageSize ? (
            <div className="mt-6 flex justify-center gap-2">
              {data.page > 1 ? <Button variant="outline" size="sm" onClick={() => void navigate({ search: (p) => ({ ...p, page: data.page - 1 }) })}>Previous</Button> : null}
              <Button variant="outline" size="sm" onClick={() => void navigate({ search: (p) => ({ ...p, page: data.page + 1 }) })}>Next page</Button>
            </div>
          ) : data && data.page > 1 ? (
            <div className="mt-6 flex justify-center"><Button variant="outline" size="sm" onClick={() => void navigate({ search: (p) => ({ ...p, page: data.page - 1 }) })}>Previous</Button></div>
          ) : null}
          <div className="mt-8"><MarketplaceDisclaimer /></div>
        </div>
      </div>
    </div>
  );
}

function Filters({ search, cats, set, onCountry }: {
  search: ExploreSearch; cats: MkCategory[]; set: (p: Partial<ExploreSearch>) => void; onCountry: (c: string | undefined) => void;
}) {
  const [q, setQ] = useState(search.q ?? "");
  const [city, setCity] = useState(search.city ?? "");
  const [min, setMin] = useState(search.min?.toString() ?? "");
  const [max, setMax] = useState(search.max?.toString() ?? "");
  const parents = cats.filter((c) => !c.parent_id);
  const sel = "h-9 w-full rounded-md border border-input bg-background px-2 text-sm";
  return (
    <form className="space-y-4" onSubmit={(e) => {
      e.preventDefault();
      set({ q: q || undefined, city: city || undefined, min: min ? Number(min) : undefined, max: max ? Number(max) : undefined });
    }}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input aria-label="Search listings" className="pl-8" placeholder="Product, brand, model…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="f-cat">Category</Label>
        <select id="f-cat" className={sel} value={search.category ?? ""} onChange={(e) => set({ category: e.target.value || undefined })}>
          <option value="">All categories</option>
          {parents.map((p) => (
            <optgroup key={p.id} label={p.title}>
              <option value={p.slug}>All {p.title}</option>
              {cats.filter((c) => c.parent_id === p.id).map((c) => <option key={c.id} value={c.slug}>{c.title}</option>)}
            </optgroup>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5"><Label htmlFor="f-min">Min price</Label><Input id="f-min" inputMode="decimal" value={min} onChange={(e) => setMin(e.target.value.replace(/[^\d.]/g, ""))} /></div>
        <div className="space-y-1.5"><Label htmlFor="f-max">Max price</Label><Input id="f-max" inputMode="decimal" value={max} onChange={(e) => setMax(e.target.value.replace(/[^\d.]/g, ""))} /></div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="f-cond">Condition</Label>
        <select id="f-cond" className={sel} value={search.condition ?? ""} onChange={(e) => set({ condition: (e.target.value || undefined) as ExploreSearch["condition"] })}>
          <option value="">Any condition</option>
          {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="f-type">Listing type</Label>
        <select id="f-type" className={sel} value={search.type ?? ""} onChange={(e) => set({ type: (e.target.value || undefined) as ExploreSearch["type"] })}>
          <option value="">All types</option>
          {LISTING_TYPES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      <div className="space-y-1.5"><Label>Country</Label><CountrySelect allowAny value={search.country} onChange={onCountry} /></div>
      <div className="space-y-1.5"><Label htmlFor="f-region">Province / state / region</Label>
        <RegionInput id="f-region" allowAny country={search.country} value={search.region ?? ""} onChange={(v) => set({ region: v || undefined })} />
      </div>
      <div className="space-y-1.5"><Label htmlFor="f-city">City</Label><Input id="f-city" value={city} maxLength={80} onChange={(e) => setCity(e.target.value)} /></div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="flex-1">Apply</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => { setQ(""); setCity(""); setMin(""); setMax(""); set({ q: undefined, category: undefined, min: undefined, max: undefined, condition: undefined, type: undefined, region: undefined, city: undefined, sort: undefined }); }}>Clear</Button>
      </div>
    </form>
  );
}
