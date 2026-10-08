import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Shirt } from "lucide-react";

import { Button } from "@/components/ui/button";
import { shopUrlQuery } from "@/lib/calculators.functions";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/shop")({
  head: () => pageMeta({
    title: "Shop HVAC Merchandise — Welcome to HVAC",
    description: "Official Welcome to HVAC clothing and merchandise for technicians, apprentices and students. Visit our store.",
    path: "/shop",
  }),
  component: Shop,
});

function Shop() {
  const { data } = useQuery(shopUrlQuery);
  const url = data?.url ?? "https://store.welcometohvac.com/";
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <div className="rounded-xl border bg-card p-8 text-center">
        <Shirt className="mx-auto h-8 w-8" />
        <h1 className="mt-4 text-3xl font-bold tracking-tight">HVAC Merchandise</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
          Wear the trade. Our official Welcome to HVAC clothing store has shirts, hoodies and gear for technicians, apprentices and anyone who keeps buildings comfortable.
        </p>
        <Button asChild className="mt-6">
          <a href={url} target="_blank" rel="noopener noreferrer">Visit Our Store <ExternalLink className="ml-1.5 h-4 w-4" /></a>
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">Opens our store in a new tab. Orders and payments are handled by the store.</p>
      </div>
    </div>
  );
}
