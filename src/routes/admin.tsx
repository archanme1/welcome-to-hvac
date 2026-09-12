import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Welcome to HVAC" },
      { name: "description", content: "Manage Welcome to HVAC content." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function Page() {
  const { user, loading, isStaff } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth", search: { next: "/admin" } });
  }, [loading, user, navigate]);

  if (loading || !user) return null;

  if (!isStaff) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This area is limited to editors and administrators.
        </p>
        <Button asChild size="sm" variant="outline" className="mt-6">
          <Link to="/">Back to the knowledge base</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">Content admin</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The structured content editor is being built next: create, draft, preview, publish, archive,
        categorise, tag and relate topics without code changes.
      </p>
    </div>
  );
}
