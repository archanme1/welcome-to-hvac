import { useQuery } from "@tanstack/react-query";

import { liveLearnersQuery } from "@/lib/calculators.functions";

/** Live learner count from the anonymous presence heartbeat. Hidden if unavailable. */
export function LiveLearners() {
  const { data } = useQuery(liveLearnersQuery);
  const count = data?.count;
  if (count == null || count < 1) return null;
  const label = `${count.toLocaleString()} ${count === 1 ? "learner" : "learners"} online`;
  return (
    <div className="flex items-center gap-1.5 rounded-full border bg-muted/40 px-2 py-1 text-xs font-medium text-muted-foreground sm:px-2.5" title={label} aria-label={label}>
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
      </span>
      <span className="tabular-nums text-foreground">{count.toLocaleString()}</span>
      <span className="hidden sm:inline">{count === 1 ? "learner" : "learners"} online</span>
    </div>
  );
}
