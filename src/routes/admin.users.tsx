import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { adminSetPro, adminSetRole, adminUsersQuery } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/users")({ component: Users });

function Users() {
  const { isStaff } = useAuth();
  const qc = useQueryClient();
  const { data: users, error } = useQuery(adminUsersQuery(isStaff));

  const run = async (fn: () => Promise<unknown>, message: string) => {
    try {
      await fn();
      toast.success(message);
      await qc.invalidateQueries({ queryKey: ["admin", "users"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed.");
    }
  };

  if (error) {
    return (
      <p className="text-sm text-muted-foreground">
        Only administrators can manage people and subscriptions.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <ul className="divide-y divide-border">
        {(users ?? []).map((u) => (
          <li key={u.id} className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm">
            <span className="font-medium">{u.email ?? u.id}</span>
            <div className="flex gap-1">
              {u.roles.map((r) => (
                <Badge key={r} variant="secondary">
                  {r}
                </Badge>
              ))}
              {u.pro ? <Badge>HVAC Pro</Badge> : null}
            </div>
            <div className="ml-auto flex flex-wrap gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  run(
                    () =>
                      adminSetRole({
                        data: { userId: u.id, role: "editor", grant: !u.roles.includes("editor") },
                      }),
                    "Editor role updated.",
                  )
                }
              >
                {u.roles.includes("editor") ? "Remove editor" : "Make editor"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  run(
                    () =>
                      adminSetRole({
                        data: { userId: u.id, role: "admin", grant: !u.roles.includes("admin") },
                      }),
                    "Administrator role updated.",
                  )
                }
              >
                {u.roles.includes("admin") ? "Remove admin" : "Make admin"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  run(
                    () => adminSetPro({ data: { userId: u.id, grant: !u.pro, interval: "annual" } }),
                    u.pro ? "HVAC Pro cancelled." : "HVAC Pro granted for a year.",
                  )
                }
              >
                {u.pro ? "Cancel Pro" : "Grant Pro"}
              </Button>
            </div>
          </li>
        ))}
        {!(users ?? []).length ? (
          <li className="px-4 py-6 text-sm text-muted-foreground">No accounts yet.</li>
        ) : null}
      </ul>
    </div>
  );
}
