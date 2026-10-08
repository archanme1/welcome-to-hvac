import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { ToolCard } from "@/components/calculators/tool-card";
import { ALL_TOOLS, CATEGORIES, isIndexable } from "@/lib/calculators/catalog";
import { breadcrumbLd, itemListLd, jsonLdScript, pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/calculators/category/$slug")({
  loader: ({ params }) => {
    const cat = CATEGORIES.find((c) => c.id === params.slug);
    if (!cat) throw notFound();
    return { cat };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "Not found" }, { name: "robots", content: "noindex" }] };
    const { cat } = loaderData;
    const path = `/calculators/category/${params.slug}`;
    const tools = ALL_TOOLS.filter((t) => t.category === cat.id);
    return {
      ...pageMeta({ title: `${cat.title} Calculators — Welcome to HVAC`, description: `${cat.blurb} ${tools.length} HVAC tools with formulas, examples and unit conversion.`, path }),
      scripts: [
        jsonLdScript(itemListLd(`${cat.title} calculators`, tools.filter(isIndexable).map((t) => ({ name: t.title, path: `/calculators/${t.slug}` })))),
        jsonLdScript(breadcrumbLd([{ name: "Home", path: "/" }, { name: "Calculators", path: "/calculators" }, { name: cat.title, path }])),
      ],
    };
  },
  notFoundComponent: () => <p className="p-8 text-sm text-muted-foreground">Category not found.</p>,
  component: Page,
});

function Page() {
  const { cat } = Route.useLoaderData();
  const tools = ALL_TOOLS.filter((t) => t.category === cat.id);
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <nav className="text-xs text-muted-foreground"><Link to="/calculators" className="hover:text-foreground">Calculators</Link> / {cat.title}</nav>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">{cat.title} Calculators</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{cat.blurb}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{tools.map((t) => <ToolCard key={t.slug} tool={t} />)}</div>
    </div>
  );
}
