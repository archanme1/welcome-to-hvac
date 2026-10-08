import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { ToolCard } from "@/components/calculators/tool-card";
import { ALL_TOOLS, CATEGORIES, isIndexable } from "@/lib/calculators/catalog";
import { itemListLd, jsonLdScript, pageMeta, breadcrumbLd } from "@/lib/seo";

const TITLE = "HVAC Engineering Tools & Calculators — Welcome to HVAC";
const DESC = "HVAC calculators and engineering tools: unit converter, BTU to kW, superheat, subcooling, CFM, duct sizing, voltage drop, heat loss, combustion air and printable checklists.";

export const Route = createFileRoute("/calculators/")({
  head: () => {
    const base = pageMeta({ title: TITLE, description: DESC, path: "/calculators" });
    return {
      ...base,
      scripts: [
        jsonLdScript(itemListLd("HVAC calculators", ALL_TOOLS.filter(isIndexable).map((t) => ({ name: t.title, path: `/calculators/${t.slug}` })))),
        jsonLdScript(breadcrumbLd([{ name: "Home", path: "/" }, { name: "Calculators", path: "/calculators" }])),
      ],
    };
  },
  component: Hub,
});

function Hub() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return ALL_TOOLS.filter((t) => (cat === "all" || t.category === cat) && (!s || `${t.title} ${t.description} ${(t.keywords ?? []).join(" ")}`.toLowerCase().includes(s)));
  }, [q, cat]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Engineering Tools & Calculators</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
        Practical calculators for HVAC technicians, apprentices, electricians and engineering students. The universal unit converter, basic conversions and safety checklists are free; HVAC Pro unlocks results for every other calculator. Each tool shows its formula, assumptions and a worked example.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input aria-label="Search calculators" placeholder="Search calculators (e.g. superheat, voltage drop)" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" />
        </div>
        <select aria-label="Filter by category" value={cat} onChange={(e) => setCat(e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      {q || cat !== "all" ? (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-muted-foreground">{filtered.length} tools</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((t) => <ToolCard key={t.slug} tool={t} />)}</div>
        </section>
      ) : (
        CATEGORIES.map((c) => {
          const tools = ALL_TOOLS.filter((t) => t.category === c.id);
          return (
            <section key={c.id} className="mt-10">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg font-semibold">{c.title}</h2>
                <Link to="/calculators/category/$slug" params={{ slug: c.id }} className="text-xs text-muted-foreground hover:text-foreground">View all {tools.length}</Link>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{c.blurb}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{tools.slice(0, 6).map((t) => <ToolCard key={t.slug} tool={t} />)}</div>
            </section>
          );
        })
      )}
    </div>
  );
}
