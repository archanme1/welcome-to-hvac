import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { adminOverviewQuery } from "@/lib/admin.functions";
import { CONTENT_TYPE_LABEL } from "@/lib/hvac-types";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

function Dashboard() {
  const { isStaff } = useAuth();
  const { data } = useQuery(adminOverviewQuery(isStaff));

  const stats = [
    { label: "Published", value: data?.published ?? 0 },
    { label: "Drafts", value: data?.drafts ?? 0 },
    { label: "Archived", value: data?.archived ?? 0 },
    { label: "Categories", value: data?.categories ?? 0 },
    { label: "Questions", value: data?.questions ?? 0 },
    { label: "Quizzes", value: data?.quizzes ?? 0 },
    { label: "Scenarios", value: data?.scenarios ?? 0 },
    { label: "Symptoms", value: data?.symptoms ?? 0 },
    { label: "Learning paths", value: data?.paths ?? 0 },
    { label: "Diagnostic trees", value: data?.trees ?? 0 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link to="/admin/content/$id" params={{ id: "new" }}>
            New topic
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link to="/admin/content">Browse content</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-4">
            <div className="text-2xl font-semibold">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-semibold">Recently updated</h2>
        <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
          {(data?.recent ?? []).map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm">
              <Link
                to="/admin/content/$id"
                params={{ id: r.id }}
                className="font-medium hover:underline"
              >
                {r.title}
              </Link>
              <span className="text-xs text-muted-foreground">
                {CONTENT_TYPE_LABEL[r.content_type]} · {r.status}
              </span>
              <span className="ml-auto text-xs text-muted-foreground">
                {new Date(r.updated_at).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
