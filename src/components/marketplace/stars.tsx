import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingSummary({ avg, count, className }: { avg: number | null; count: number; className?: string }) {
  if (!count || avg == null) return <span className={cn("text-xs text-muted-foreground", className)}>No ratings yet</span>;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs", className)} aria-label={`${avg} out of 5 stars from ${count} ratings`}>
      <span className="font-semibold">{avg.toFixed(1)}</span>
      <span className="inline-flex">{[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn("h-3.5 w-3.5", i <= Math.round(avg) ? "fill-primary text-primary" : "text-muted-foreground")} />
      ))}</span>
      <span className="text-muted-foreground">({count} {count === 1 ? "rating" : "ratings"})</span>
    </span>
  );
}

export function StarPicker({ value, onChange, disabled }: { value: number; onChange: (n: number) => void; disabled?: boolean }) {
  return (
    <div className="inline-flex" role="radiogroup" aria-label="Rate the seller">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" role="radio" aria-checked={value === i} aria-label={`${i} star${i > 1 ? "s" : ""}`}
          disabled={disabled} onClick={() => onChange(i)} className="p-0.5 disabled:opacity-50">
          <Star className={cn("h-6 w-6", i <= value ? "fill-primary text-primary" : "text-muted-foreground")} />
        </button>
      ))}
    </div>
  );
}
