import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";

import { Button } from "@/components/ui/button";

const DESC =
  "Expert Help connects you with experienced HVAC professionals. It is coming soon to Welcome to HVAC.";

export const Route = createFileRoute("/experts")({
  head: () => ({
    meta: [
      { title: "Expert Help (Coming Soon) — Welcome to HVAC" },
      { name: "description", content: DESC },
      { property: "og:title", content: "Expert Help (Coming Soon) — Welcome to HVAC" },
      { property: "og:description", content: DESC },
      { property: "og:url", content: "https://www.welcometohvac.com/experts" },
    ],
    links: [{ rel: "canonical", href: "https://www.welcometohvac.com/experts" }],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
      <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
        <Clock className="h-3.5 w-3.5" /> Coming soon
      </span>
      <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">Expert Help</h1>
      <p className="mt-4 text-base leading-7 text-muted-foreground">{DESC}</p>
      <p className="mt-4 text-base leading-7 text-muted-foreground">
        Until then, the documentation, diagnostics and the HVAC Pro AI Tutor cover most learning
        and field questions. For work on live equipment, follow manufacturer instructions and your
        local code, and involve a licensed professional where required.
      </p>
      <div className="mt-8 flex flex-wrap gap-2">
        <Button asChild>
          <Link to="/troubleshooting">Go to Troubleshooting</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/pricing">See HVAC Pro</Link>
        </Button>
      </div>
    </div>
  );
}
