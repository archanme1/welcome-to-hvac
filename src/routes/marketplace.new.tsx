import { createFileRoute } from "@tanstack/react-router";

import { ListingForm } from "@/components/marketplace/listing-form";
import { MarketplaceSubnav } from "@/components/marketplace/subnav";
import { ProOnly } from "@/components/marketplace/pro-gate";

export const Route = createFileRoute("/marketplace/new")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Post a Listing — Trades Marketplace | Welcome to HVAC" },
      { name: "description", content: "HVAC Pro members can list tools, equipment and parts on the Welcome to HVAC Trades Marketplace." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <MarketplaceSubnav />
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Post a Listing</h1>
      <ProOnly message="Posting listings is part of HVAC Pro. Upgrade to WelcomeToHVAC Pro to sell, trade or give away equipment on the marketplace."><ListingForm /></ProOnly>
    </div>
  ),
});
