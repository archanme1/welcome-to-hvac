import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { publicDb } from "@/lib/hvac.server";
import { exploreSearchSchema, PAGE_SIZE, type ExploreSearch } from "@/lib/marketplace/shared";

export type MkCategory = { id: string; slug: string; title: string; parent_id: string | null; sort_order: number };
export type MkSeller = { id: string; name: string; rating_avg: number | null; rating_count: number; member_since: string | null };
export type MkCard = {
  id: string; slug: string; title: string; price: number; currency: string; condition: string;
  listing_type: string; category_id: string; country: string; region: string; city: string;
  created_at: string; seller_id: string; image: string | null;
};

const SIGN_SECONDS = 60 * 60 * 24 * 7;

async function signPaths(db: ReturnType<typeof publicDb>, paths: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const unique = Array.from(new Set(paths.filter(Boolean)));
  if (!unique.length) return map;
  const { data } = await db.storage.from("marketplace").createSignedUrls(unique, SIGN_SECONDS);
  for (const row of data ?? []) if (row.path && row.signedUrl) map.set(row.path, row.signedUrl);
  return map;
}

async function sellers(db: ReturnType<typeof publicDb>, ids: string[]): Promise<Record<string, MkSeller>> {
  const unique = Array.from(new Set(ids));
  if (!unique.length) return {};
  const { data } = await db.rpc("marketplace_sellers", { _ids: unique });
  const out: Record<string, MkSeller> = {};
  for (const s of (data ?? []) as MkSeller[]) out[s.id] = { ...s, rating_avg: s.rating_avg == null ? null : Number(s.rating_avg) };
  return out;
}

export const listMkCategories = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicDb()
    .from("marketplace_categories")
    .select("id, slug, title, parent_id, sort_order")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw new Error("Categories are unavailable right now.");
  return (data ?? []) as MkCategory[];
});
export const mkCategoriesQuery = queryOptions({ queryKey: ["mk", "categories"], queryFn: () => listMkCategories(), staleTime: 10 * 60_000 });

async function runSearch(s: ExploreSearch & { categoryId?: string | null | undefined; limit?: number | undefined; excludeId?: string | undefined }) {
  const db = publicDb();
  const page = s.page ?? 1;
  const limit = s.limit ?? PAGE_SIZE;
  const { data, error } = await db.rpc("marketplace_search", {
    _q: s.q ?? "",
    _category: (s.categoryId ?? null) as string,
    _min: (s.min ?? null) as number,
    _max: (s.max ?? null) as number,
    _condition: (s.condition ?? null) as string,
    _type: (s.type ?? null) as string,
    _country: (s.country ?? null) as string,
    _region: (s.region ?? null) as string,
    _city: (s.city ?? null) as string,
    _sort: s.sort ?? "newest",
    _limit: limit + (s.excludeId ? 1 : 0),
    _offset: (page - 1) * limit,
  });
  if (error) throw new Error("Listings are unavailable right now.");
  let rows = (data ?? []) as Array<Omit<MkCard, "image"> & { image_path: string | null; total: number }>;
  if (s.excludeId) rows = rows.filter((r) => r.id !== s.excludeId).slice(0, limit);
  const signed = await signPaths(db, rows.map((r) => r.image_path ?? ""));
  const sellerMap = await sellers(db, rows.map((r) => r.seller_id));
  const total = Number(rows[0]?.total ?? 0);
  const items: MkCard[] = rows.map(({ image_path, total: _t, ...r }) => ({
    ...r, price: Number(r.price), image: image_path ? signed.get(image_path) ?? null : null,
  }));
  return { items, sellers: sellerMap, total, page, pageSize: limit };
}

export const searchListings = createServerFn({ method: "GET" })
  .inputValidator((d) => exploreSearchSchema.extend({ categoryId: z.string().uuid().nullable().optional() }).parse(d))
  .handler(async ({ data }) => runSearch(data));

export const searchListingsQuery = (s: ExploreSearch & { categoryId?: string | null }) =>
  queryOptions({ queryKey: ["mk", "search", s], queryFn: () => searchListings({ data: s }), staleTime: 30_000 });

export const getListing = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(3).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const db = publicDb();
    const { data: row } = await db
      .from("marketplace_listings")
      .select("id, slug, title, description, category_id, price, currency, negotiable, condition, listing_type, country, region, city, brand, model_number, approx_age, pickup, delivery, specs, status, created_at, updated_at, seller_id")
      .eq("slug", data.slug)
      .eq("status", "active")
      .maybeSingle();
    if (!row) return null;
    const { data: imgs } = await db.from("marketplace_listing_images").select("path").eq("listing_id", row.id).order("sort_order");
    const signed = await signPaths(db, (imgs ?? []).map((i) => i.path));
    const sellerMap = await sellers(db, [row.seller_id]);
    const related = await runSearch({ categoryId: row.category_id, limit: 4, excludeId: row.id });
    return {
      listing: { ...row, price: Number(row.price) },
      images: (imgs ?? []).map((i) => signed.get(i.path)).filter((u): u is string => !!u),
      seller: sellerMap[row.seller_id] ?? { id: row.seller_id, name: "Member", rating_avg: null, rating_count: 0, member_since: null },
      related: related.items,
    };
  });
export const listingQuery = (slug: string) =>
  queryOptions({ queryKey: ["mk", "listing", slug], queryFn: () => getListing({ data: { slug } }), staleTime: 30_000 });

/** For the sitemap: active listings and categories that hold at least one. */
export async function marketplaceSitemapEntries() {
  const db = publicDb();
  const { data: listings } = await db.from("marketplace_listings").select("slug, category_id, updated_at").eq("status", "active").order("updated_at", { ascending: false }).limit(20000);
  const { data: cats } = await db.from("marketplace_categories").select("id, slug, parent_id").eq("is_active", true);
  const used = new Set((listings ?? []).map((l) => l.category_id));
  const catSlugs = (cats ?? []).filter((c) => used.has(c.id) || (cats ?? []).some((k) => k.parent_id === c.id && used.has(k.id))).map((c) => c.slug);
  return { listings: listings ?? [], categories: catSlugs };
}
