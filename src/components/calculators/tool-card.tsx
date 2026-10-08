import { Lock } from "lucide-react";

import { AppLink } from "@/components/app-link";
import type { CalculatorMeta } from "@/lib/calculators/types";

export function ToolCard({ tool }: { tool: CalculatorMeta }) {
  return (
    <AppLink to={`/calculators/${tool.slug}`} className="flex flex-col rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold">{tool.short}</p>
        {tool.kind === "pending" ? (
          <span className="shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">Soon</span>
        ) : tool.tier === "pro" ? (
          <span className="flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground"><Lock className="h-2.5 w-2.5" />Pro</span>
        ) : (
          <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium uppercase text-primary">Free</span>
        )}
      </div>
      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{tool.description}</p>
    </AppLink>
  );
}
