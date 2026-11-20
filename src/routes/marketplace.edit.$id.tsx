import { createFileRoute } from "@tanstack/react-router";

import { ListingForm } from "@/components/marketplace/listing-form";
import { MarketplaceSubnav } from "@/components/marketplace/subnav";
import { ProOnly } from "@/components/marketplace/pro-gate";

export const Route = createFileRoute("/marketplace/edit/$id")({
  ssr: false,
  head: () => ({ meta: [{ title: "Edit Listing — Trades Marketplace" }, { name: "robots", content: "noindex" }] }),
  component: Edit,
});

function Edit() {
  const { id } = Route.useParams();
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <MarketplaceSubnav />
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Edit Listing</h1>
      <ProOnly><ListingForm listingId={id} /></ProOnly>
    </div>
  );
}
