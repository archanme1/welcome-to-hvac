import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Lightbulb } from "lucide-react";

import { AppLink } from "@/components/app-link";
import { todaysFactQuery } from "@/lib/calculators.functions";

export function TradeKnowledge() {
  const { data: fact } = useQuery(todaysFactQuery);
  if (!fact) return null;
  return (
    <section className="mt-16" aria-labelledby="trade-knowledge">
      <h2 id="trade-knowledge" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Today's Trade Knowledge</h2>
      <div className="mt-4 rounded-xl border bg-card p-6">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          <span className="rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{fact.category}</span>
        </div>
        <h3 className="mt-3 text-xl font-semibold tracking-tight">{fact.headline}</h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{fact.explanation}</p>
        {fact.example ? (
          <p className="mt-3 max-w-3xl rounded-md bg-muted/50 px-3 py-2 text-sm leading-6"><span className="font-medium">In practice: </span>{fact.example}</p>
        ) : null}
        {fact.learn_more_href ? (
          <AppLink to={fact.learn_more_href} className="mt-4 inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline">
            {fact.learn_more_label ?? "Learn more"} <ArrowRight className="h-3.5 w-3.5" />
          </AppLink>
        ) : null}
      </div>
    </section>
  );
}
