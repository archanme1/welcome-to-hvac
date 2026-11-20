import { DISCLAIMER, PROHIBITED_NOTE } from "@/lib/marketplace/shared";

export function MarketplaceDisclaimer({ withProhibited }: { withProhibited?: boolean }) {
  return (
    <div className="rounded-lg border bg-muted/40 p-4 text-xs leading-5 text-muted-foreground">
      <p>{DISCLAIMER}</p>
      {withProhibited ? <p className="mt-2">{PROHIBITED_NOTE}</p> : null}
    </div>
  );
}
