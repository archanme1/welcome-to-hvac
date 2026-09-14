import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { adminFinanceQuery } from "@/lib/finance.functions";
import { getStripeEnvironment, paymentsConfigured } from "@/lib/stripe";

export const Route = createFileRoute("/admin/finance")({ component: Finance });

function money(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: (currency || "usd").toUpperCase(),
  }).format(amount);
}

function monthLabel(key: string) {
  const parts = key.split("-");
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function Finance() {
  const { isStaff } = useAuth();
  const ready = isStaff && paymentsConfigured();
  const { data, error, isLoading } = useQuery(
    adminFinanceQuery(ready, ready ? getStripeEnvironment() : "sandbox"),
  );

  if (!paymentsConfigured()) {
    return <p className="text-sm text-muted-foreground">Payments are not configured yet.</p>;
  }
  if (error) {
    return (
      <p className="text-sm text-muted-foreground">
        Only administrators can view financial information.
      </p>
    );
  }
  if (isLoading || !data) {
    return <p className="text-sm text-muted-foreground">Loading financial overview…</p>;
  }

  const stats = [
    { label: "Total collected", value: money(data.totalCollected, data.currency) },
    { label: "Refunded", value: money(data.refunded, data.currency) },
    { label: "Net collected", value: money(data.netCollected, data.currency) },
    { label: "This month", value: money(data.thisMonth, data.currency) },
    { label: "Last month", value: money(data.lastMonth, data.currency) },
    { label: "Successful payments", value: String(data.payments.succeeded) },
    { label: "Failed payments", value: String(data.payments.failed) },
    { label: "Refunds", value: String(data.payments.refunds) },
    { label: "Active members", value: String(data.memberships.active) },
    { label: "On free trial", value: String(data.memberships.trialing) },
    { label: "Cancelled", value: String(data.memberships.canceled) },
    { label: "Payment retrying", value: String(data.memberships.pastDue) },
    { label: "Monthly plans", value: String(data.memberships.monthly) },
    { label: "Annual plans", value: String(data.memberships.annual) },
    { label: "Granted manually", value: String(data.memberships.manual) },
  ];

  return (
    <div className="space-y-8">
      {data.error ? (
        <p className="rounded-md border border-border bg-card p-3 text-sm text-muted-foreground">
          Membership numbers are current. Payment totals could not be loaded: {data.error}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-4">
            <div className="text-xl font-semibold">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {data.last12Months.length ? (
        <section>
          <h2 className="text-sm font-semibold">Revenue by month</h2>
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="pb-2 font-medium">Month</th>
                <th className="pb-2 text-right font-medium">Collected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.last12Months.map((m) => (
                <tr key={m.month}>
                  <td className="py-2">{monthLabel(m.month)}</td>
                  <td className="py-2 text-right">{money(m.amount, data.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      <section>
        <h2 className="text-sm font-semibold">Recent payments</h2>
        {data.recent.length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">No payments yet.</p>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Member</th>
                  <th className="pb-2 font-medium">Description</th>
                  <th className="pb-2 text-right font-medium">Amount</th>
                  <th className="pb-2 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.recent.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 whitespace-nowrap">
                      {new Date(p.created).toLocaleDateString()}
                    </td>
                    <td className="py-2">{p.email ?? "—"}</td>
                    <td className="py-2">{p.description}</td>
                    <td className="py-2 text-right">{money(p.amount, p.currency)}</td>
                    <td className="py-2 text-right capitalize">
                      {p.refunded ? "refunded" : p.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
