import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { AppLink } from "@/components/app-link";
import { CalculatorView } from "@/components/calculators/calculator-view";
import { ChecklistView } from "@/components/calculators/checklist-view";
import { ToolCard } from "@/components/calculators/tool-card";
import { UnitConverter } from "@/components/calculators/unit-converter";
import { CHECKLIST_BY_SLUG, TOOL_BY_SLUG, ALL_TOOLS } from "@/lib/calculators/catalog";
import { categoryTitle } from "@/lib/calculators/registry";
import { breadcrumbLd, canonicalUrl, clampDescription, jsonLdScript, pageMeta, SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/calculators/$slug")({
  loader: ({ params }) => {
    const tool = TOOL_BY_SLUG[params.slug];
    if (!tool) throw notFound();
    return { slug: tool.slug };
  },
  head: ({ loaderData }) => {
    const tool = loaderData ? TOOL_BY_SLUG[loaderData.slug] : undefined;
    if (!tool) return { meta: [{ title: "Not found" }, { name: "robots", content: "noindex" }] };
    const path = `/calculators/${tool.slug}`;
    const base = pageMeta({ title: `${tool.title} — Welcome to HVAC`, description: clampDescription(tool.description), path, type: "article" });
    return {
      meta: [...base.meta, ...(tool.kind === "pending" ? [{ name: "robots", content: "noindex" }] : []), ...(tool.keywords ? [{ name: "keywords", content: tool.keywords.join(", ") }] : [])],
      links: base.links,
      scripts: [
        jsonLdScript({
          "@context": "https://schema.org", "@type": "SoftwareApplication", name: tool.title, description: tool.description,
          applicationCategory: "UtilitiesApplication", operatingSystem: "Web", url: canonicalUrl(path),
          offers: { "@type": "Offer", price: tool.tier === "free" ? "0" : "5", priceCurrency: "USD" },
          publisher: { "@type": "Organization", name: "Welcome to HVAC", url: SITE_URL },
        }),
        jsonLdScript(breadcrumbLd([{ name: "Home", path: "/" }, { name: "Calculators", path: "/calculators" }, { name: categoryTitle(tool.category), path: `/calculators/category/${tool.category}` }, { name: tool.short, path }])),
      ],
    };
  },
  notFoundComponent: () => <p className="p-8 text-sm text-muted-foreground">Calculator not found. <Link to="/calculators" className="underline">Browse all calculators</Link></p>,
  component: Page,
});

function Page() {
  const { slug } = Route.useLoaderData();
  const tool = TOOL_BY_SLUG[slug]!;
  const related = (tool.related ?? []).map((s) => TOOL_BY_SLUG[s]).filter(Boolean);
  const fallbackRelated = related.length ? related : ALL_TOOLS.filter((t) => t.category === tool.category && t.slug !== tool.slug && t.kind !== "pending").slice(0, 4);

  return (
    <article className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <nav className="text-xs text-muted-foreground">
        <Link to="/calculators" className="hover:text-foreground">Calculators</Link> /{" "}
        <Link to="/calculators/category/$slug" params={{ slug: tool.category }} className="hover:text-foreground">{categoryTitle(tool.category)}</Link>
      </nav>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">{tool.title}</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{tool.intro}</p>
      <p className="mt-2 text-xs text-muted-foreground">{tool.kind === "pending" ? "Coming soon" : tool.tier === "free" ? "Free tool" : "HVAC Pro calculator — inputs, formula and example are open to everyone."}</p>

      <div className="mt-6">
        {tool.kind === "converter" ? <UnitConverter /> : tool.kind === "checklist" ? <ChecklistView checklist={CHECKLIST_BY_SLUG[tool.slug]!} /> : tool.kind === "pending" ? (
          <div className="rounded-xl border border-dashed bg-card p-6 text-sm">
            <p className="font-medium">This tool is being prepared.</p>
            <p className="mt-1 text-muted-foreground">We publish reference tools only once verified data is in place. Needed: {tool.dataNeeded}</p>
          </div>
        ) : <CalculatorView meta={tool} />}
      </div>

      {tool.assumptions?.length ? (
        <div className="mt-6 rounded-lg border bg-muted/40 p-4 text-xs leading-5 text-muted-foreground">
          {tool.assumptions.map((a) => <p key={a}>{a}</p>)}
        </div>
      ) : null}

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        {tool.formula?.length ? (
          <section>
            <h2 className="text-lg font-semibold">Formula</h2>
            <ul className="mt-2 space-y-1.5">{tool.formula.map((f) => <li key={f} className="rounded bg-muted/50 px-3 py-2 font-mono text-sm">{f}</li>)}</ul>
            {tool.variables?.length ? (
              <>
                <h3 className="mt-4 text-sm font-semibold">Variables</h3>
                <dl className="mt-1 space-y-1 text-sm">{tool.variables.map(([k, v]) => <div key={k}><dt className="inline font-mono font-medium">{k}</dt> <dd className="inline text-muted-foreground">— {v}</dd></div>)}</dl>
              </>
            ) : null}
          </section>
        ) : null}
        {tool.example ? (
          <section>
            <h2 className="text-lg font-semibold">Example calculation</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{tool.example}</p>
            {tool.application ? (<><h3 className="mt-4 text-sm font-semibold">Practical HVAC use</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{tool.application}</p></>) : null}
          </section>
        ) : null}
        {tool.mistakes?.length ? (
          <section>
            <h2 className="text-lg font-semibold">Common mistakes</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">{tool.mistakes.map((m) => <li key={m}>{m}</li>)}</ul>
          </section>
        ) : null}
        {tool.lessons?.length ? (
          <section>
            <h2 className="text-lg font-semibold">Related lessons</h2>
            <ul className="mt-2 space-y-1 text-sm">{tool.lessons.map((l) => <li key={l.q}><Link to="/search" search={{ q: l.q, kind: "all", page: 1 }} className="underline underline-offset-2">{l.label}</Link></li>)}</ul>
          </section>
        ) : null}
      </div>

      {fallbackRelated.length ? (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Related calculators</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">{fallbackRelated.map((t) => <ToolCard key={t!.slug} tool={t!} />)}</div>
        </section>
      ) : null}
      <p className="mt-10 text-xs text-muted-foreground">Educational tool. Results are estimates from the stated formulas; always confirm with manufacturer data and the code adopted in your jurisdiction. <AppLink to="/calculators" className="underline">All calculators</AppLink></p>
    </article>
  );
}
