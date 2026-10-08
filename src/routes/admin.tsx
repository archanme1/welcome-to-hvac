import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { claimFirstAdmin } from "@/lib/admin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Welcome to HVAC" },
      { name: "description", content: "Manage Welcome to HVAC content." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Layout,
});

const TABS = [
  { to: "/admin", label: "Dashboard", exact: true },
  { to: "/admin/content", label: "Content" },
  { to: "/admin/practice", label: "Practice" },
  { to: "/admin/categories", label: "Categories" },
  { to: "/admin/symptoms", label: "Symptoms" },
  { to: "/admin/paths", label: "Paths" },
  { to: "/admin/diagnostics", label: "Diagnostics" },
  { to: "/admin/trade-facts", label: "Trade Facts" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/analytics", label: "Analytics" },
  { to: "/admin/finance", label: "Finance" },
  { to: "/admin/settings", label: "Settings" },
] as const;

function Layout() {
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
        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/">Back to the knowledge base</Link>
          </Button>
          <Button
            size="sm"
            onClick={async () => {
              const res = await claimFirstAdmin();
              toast[res.ok ? "success" : "error"](res.message);
              if (res.ok) window.location.reload();
            }}
          >
            Claim administrator access
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Claiming only works while no administrator exists yet.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">Content admin</h1>
      <nav className="mt-4 flex flex-wrap gap-1 border-b border-border pb-2">
        {TABS.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            activeOptions={{ exact: t.to === "/admin" }}
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground data-[status=active]:bg-accent data-[status=active]:text-foreground"
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
}
