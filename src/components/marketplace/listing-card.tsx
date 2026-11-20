import { ImageOff } from "lucide-react";

import { AppLink } from "@/components/app-link";
import type { MkCard, MkSeller } from "@/lib/marketplace.functions";
import { conditionLabel, formatPrice } from "@/lib/marketplace/shared";
import { RatingSummary } from "./stars";

export function ListingCard({ item, seller, categoryTitle }: { item: MkCard; seller?: MkSeller | undefined; categoryTitle?: string | undefined }) {
  return (
    <AppLink to={`/marketplace/listing/${item.slug}`} className="group flex flex-col overflow-hidden rounded-lg border bg-card transition-colors hover:bg-accent/40">
      <div className="aspect-[4/3] w-full bg-muted">
        {item.image ? (
          <img src={item.image} alt={item.title} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground"><ImageOff className="h-6 w-6" /></div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-sm font-semibold">{formatPrice(item.price, item.currency, item.listing_type)}</p>
        <p className="line-clamp-2 text-sm">{item.title}</p>
        <p className="text-xs text-muted-foreground">{conditionLabel(item.condition)}{categoryTitle ? ` · ${categoryTitle}` : ""}</p>
        <p className="text-xs text-muted-foreground">{item.city}, {item.region} · {new Date(item.created_at).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}</p>
        {seller ? <RatingSummary avg={seller.rating_avg} count={seller.rating_count} className="mt-auto pt-1" /> : null}
      </div>
    </AppLink>
  );
}
