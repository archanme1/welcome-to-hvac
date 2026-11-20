import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/marketplace/listing-card";
import { MarketplaceDisclaimer } from "@/components/marketplace/disclaimer";
import { MarketplaceSubnav } from "@/components/marketplace/subnav";
import { mkCategoriesQuery, searchListingsQuery } from "@/lib/marketplace.functions";
import { breadcrumbLd, itemListLd, jsonLdScript, pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/marketplace/c/$slug")({
  loader: async ({ context, params }) => {
    const cats = await context.queryClient.ensureQueryData(mkCategoriesQuery);
    const cat = cats.find((c) => c.slug === params.slug);
    if (!cat) throw notFound();
    const results = await context.queryClient.ensureQueryData(searchListingsQuery({ categoryId: cat.id }));
    return { cat, total: results.total, items: results.items.map((i) => ({ name: i.title, path: `/marketplace/listing/${i.slug}` })) };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "Category not found — Welcome to HVAC" }, { name: "robots", content: "noindex" }] };
    const { cat, total, items } = loaderData;
    const base = pageMeta({
      title: `${cat.title} for Sale — New & Used | Trades Marketplace`,
      description: `Browse new and used ${cat.title.toLowerCase()} listed by trades professionals on the Welcome to HVAC Trades Marketplace. Free to browse; contact sellers with HVAC Pro.`,
      path: `/marketplace/c/${params.slug}`,
    });
    return {
      ...base,
      // Empty category pages are thin content; keep them out of the index until they have listings.
      meta: [...base.meta, ...(total === 0 ? [{ name: "robots", content: "noindex, follow" }] : [])],
      scripts: [
        jsonLdScript(breadcrumbLd([{ name: "Marketplace", path: "/marketplace" }, { name: cat.title, path: `/marketplace/c/${params.slug}` }])),
        ...(items.length ? [jsonLdScript(itemListLd(cat.title, items))] : []),
      ],
    };
  },
  notFoundComponent: () => <p className="p-8 text-sm text-muted-foreground">That category doesn't exist. <Link to="/marketplace" className="underline">Browse all listings</Link>.</p>,
  errorComponent: () => <p className="p-8 text-sm text-muted-foreground">This category didn't load. Please refresh.</p>,
  component: CategoryPage,
});

function CategoryPage() {
  const { cat } = Route.useLoaderData();
  const { data: cats } = useSuspenseQuery(mkCategoriesQuery);
  const { data } = useSuspenseQuery(searchListingsQuery({ categoryId: cat.id }));
  const children = cats.filter((c) => c.parent_id === cat.id);
  const parent = cat.parent_id ? cats.find((c) => c.id === cat.parent_id) : null;
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <MarketplaceSubnav />
      <nav aria-label="Breadcrumb" className="mb-2 text-xs text-muted-foreground">
        <Link to="/marketplace" className="hover:text-foreground">Marketplace</Link>
        {parent ? <> / <Link to="/marketplace/c/$slug" params={{ slug: parent.slug }} className="hover:text-foreground">{parent.title}</Link></> : null}
      </nav>
      <h1 className="text-3xl font-bold tracking-tight">{cat.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{data.total} active listing{data.total === 1 ? "" : "s"}</p>
      {children.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {children.map((c) => <Link key={c.id} to="/marketplace/c/$slug" params={{ slug: c.slug }} className="rounded-full border px-3 py-1 text-xs hover:bg-accent">{c.title}</Link>)}
        </div>
      ) : null}
      {data.items.length ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {data.items.map((i) => <ListingCard key={i.id} item={i} seller={data.sellers[i.seller_id]} categoryTitle={cats.find((c) => c.id === i.category_id)?.title} />)}
        </div>
      ) : <div className="mt-6 rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">No listings here yet.</div>}
      {data.total > data.items.length ? (
        <Button asChild variant="outline" size="sm" className="mt-6"><Link to="/marketplace" search={{ category: cat.slug, page: 2 }}>See more listings</Link></Button>
      ) : null}
      <div className="mt-8"><MarketplaceDisclaimer /></div>
    </div>
  );
}
