import { createFileRoute } from "@tanstack/react-router";

import { publicDb } from "@/lib/hvac.server";
import { SITE_URL } from "@/lib/seo";
import { topicHref } from "@/lib/hvac-types";
import type { ContentType } from "@/lib/hvac-types";

const STATIC_PATHS = [
  "/",
  "/start-here",
  "/equipment",
  "/components",
  "/concepts",
  "/procedures",
  "/troubleshooting",
  "/tools",
  "/symptoms",
  "/paths",
  "/practice",
  "/pricing",
  "/experts",
];

type Entry = { loc: string; lastmod?: string | undefined };

function xml(entries: Entry[]): string {
  const urls = entries
    .map(
      (entry) =>
        `  <url><loc>${entry.loc}</loc>${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ""}</url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

async function pageAll<T>(
  fetchPage: (from: number, to: number) => Promise<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const size = 1000;
  const all: T[] = [];
  for (let page = 0; page < 50; page += 1) {
    const { data, error } = await fetchPage(page * size, page * size + size - 1);
    if (error) throw error;
    const rows = data ?? [];
    all.push(...rows);
    if (rows.length < size) break;
  }
  return all;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const db = publicDb();

        const [content, symptoms, categories, paths, trees] = await Promise.all([
          pageAll<{ slug: string; content_type: ContentType; updated_at: string }>((from, to) =>
            db
              .from("content")
              .select("slug, content_type, updated_at")
              .eq("status", "published")
              .range(from, to)
              .then((r) => ({ data: r.data as any, error: r.error as unknown })) as Promise<any>,
          ),
          pageAll<{ slug: string; updated_at: string }>((from, to) =>
            db
              .from("symptoms")
              .select("slug, updated_at")
              .eq("is_published", true)
              .range(from, to)
              .then((r) => ({ data: r.data as any, error: r.error as unknown })) as Promise<any>,
          ),
          pageAll<{ slug: string; updated_at: string }>((from, to) =>
            db
              .from("categories")
              .select("slug, updated_at")
              .eq("is_published", true)
              .range(from, to)
              .then((r) => ({ data: r.data as any, error: r.error as unknown })) as Promise<any>,
          ),
          pageAll<{ slug: string; updated_at: string }>((from, to) =>
            db
              .from("learning_paths")
              .select("slug, updated_at")
              .eq("is_published", true)
              .range(from, to)
              .then((r) => ({ data: r.data as any, error: r.error as unknown })) as Promise<any>,
          ),
          pageAll<{ slug: string; updated_at: string }>((from, to) =>
            db
              .from("diagnostic_trees")
              .select("slug, updated_at")
              .eq("status", "published")
              .range(from, to)
              .then((r) => ({ data: r.data as any, error: r.error as unknown })) as Promise<any>,
          ),
        ]);

        const entries: Entry[] = [
          ...STATIC_PATHS.map((path) => ({ loc: `${SITE_URL}${path === "/" ? "" : path}` })),
          ...content.map((row) => ({
            loc: `${SITE_URL}${topicHref(row.content_type, row.slug)}`,
            lastmod: row.updated_at?.slice(0, 10),
          })),
          ...symptoms.map((row) => ({
            loc: `${SITE_URL}/symptoms/${row.slug}`,
            lastmod: row.updated_at?.slice(0, 10),
          })),
          ...categories.map((row) => ({
            loc: `${SITE_URL}/c/${row.slug}`,
            lastmod: row.updated_at?.slice(0, 10),
          })),
          ...paths.map((row) => ({
            loc: `${SITE_URL}/paths/${row.slug}`,
            lastmod: row.updated_at?.slice(0, 10),
          })),
          ...trees.map((row) => ({
            loc: `${SITE_URL}/diagnostics/${row.slug}`,
            lastmod: row.updated_at?.slice(0, 10),
          })),
        ];

        return new Response(xml(entries), {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
