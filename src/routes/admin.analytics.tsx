import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { analyticsQuery, liveVisitorsQuery } from "@/lib/analytics.functions";
import { adminIsAdminQuery } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/analytics")({ component: Analytics });

const RANGES = [
  { key: "today", label: "Today", days: 0 },
  { key: "7", label: "7 days", days: 6 },
  { key: "30", label: "30 days", days: 29 },
  { key: "90", label: "90 days", days: 89 },
] as const;

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

function shiftDays(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return isoDay(d);
}

function Analytics() {
  const { isStaff } = useAuth();
  const { data: isAdmin } = useQuery(adminIsAdminQuery(isStaff));
  const [range, setRange] = useState<string>("7");
  const [customFrom, setCustomFrom] = useState(shiftDays(29));
  const [customTo, setCustomTo] = useState(isoDay(new Date()));

  const { from, to } = useMemo(() => {
    if (range === "custom") return { from: customFrom, to: customTo };
    const preset = RANGES.find((r) => r.key === range) ?? RANGES[1];
    return { from: shiftDays(preset.days), to: isoDay(new Date()) };
  }, [range, customFrom, customTo]);

  const enabled = isAdmin === true;
  const live = useQuery(liveVisitorsQuery(enabled));
  const { data, isLoading } = useQuery(analyticsQuery(enabled, from, to));

  if (isAdmin === false) {
    return (
      <p className="text-sm text-muted-foreground">
        Only administrators can view website analytics.
      </p>
    );
  }

  const cards = [
    { label: "Live visitors now", value: live.data?.live ?? 0 },
    { label: "Signed in now", value: live.data?.signedIn ?? 0 },
    { label: "Page views", value: data?.totals.views ?? 0 },
    { label: "Unique visitors", value: data?.totals.visitors ?? 0 },
    { label: "New accounts", value: data?.totals.signups ?? 0 },
    { label: "New memberships", value: data?.totals.newMembers ?? 0 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end gap-2">
        {RANGES.map((r) => (
          <Button
            key={r.key}
            size="sm"
            variant={range === r.key ? "default" : "outline"}
            onClick={() => setRange(r.key)}
          >
            {r.label}
          </Button>
        ))}
        <Button
          size="sm"
          variant={range === "custom" ? "default" : "outline"}
          onClick={() => setRange("custom")}
        >
          Custom
        </Button>
        {range === "custom" ? (
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              value={customFrom}
              max={customTo}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="h-9 w-auto"
              aria-label="Start date"
            />
            <span className="text-sm text-muted-foreground">to</span>
            <Input
              type="date"
              value={customTo}
              min={customFrom}
              onChange={(e) => setCustomTo(e.target.value)}
              className="h-9 w-auto"
              aria-label="End date"
            />
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-border bg-card p-4">
            <div className="text-2xl font-semibold">{c.value}</div>
            <div className="text-xs text-muted-foreground">{c.label}</div>
          </div>
        ))}
      </div>

      {isLoading || !data ? (
        <p className="text-sm text-muted-foreground">Loading analytics…</p>
      ) : (
        <>
          <section>
            <h2 className="text-sm font-semibold">Traffic</h2>
            <div className="mt-2 h-64 w-full rounded-lg border border-border bg-card p-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.series}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="views"
                    name="Page views"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.15}
                  />
                  <Area
                    type="monotone"
                    dataKey="visitors"
                    name="Visitors"
                    stroke="hsl(var(--muted-foreground))"
                    fill="hsl(var(--muted-foreground))"
                    fillOpacity={0.1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold">New accounts</h2>
            <div className="mt-2 h-56 w-full rounded-lg border border-border bg-card p-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.signupSeries}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="signups" name="New accounts" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section>
              <h2 className="text-sm font-semibold">Most viewed pages</h2>
              <Table
                head={["Page", "Views"]}
                rows={data.topPages.map((p) => [p.path, String(p.views)])}
                empty="No page views recorded yet."
              />
            </section>

            <section>
              <h2 className="text-sm font-semibold">Top searches</h2>
              <Table
                head={["Search", "Times"]}
                rows={data.topSearches.map((s) => [s.query, String(s.count)])}
                empty="No searches recorded yet."
              />
            </section>

            <section>
              <h2 className="text-sm font-semibold">Activity breakdown</h2>
              <Table
                head={["Activity", "Count"]}
                rows={data.events.map((e) => [e.event.replace(/_/g, " "), String(e.count)])}
                empty="No activity recorded yet."
              />
            </section>

            <section>
              <h2 className="text-sm font-semibold">Pages being viewed right now</h2>
              <Table
                head={["Page", "Visitors"]}
                rows={(live.data?.pages ?? []).map((p) => [p.path, String(p.count)])}
                empty="Nobody is browsing right now."
              />
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function Table({ head, rows, empty }: { head: string[]; rows: string[][]; empty: string }) {
  if (!rows.length) return <p className="mt-1 text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="mt-2 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted-foreground">
            {head.map((h, i) => (
              <th key={h} className={`px-3 py-2 font-medium ${i ? "text-right" : ""}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.join("|")}>
              {r.map((cell, i) => (
                <td key={i} className={`px-3 py-2 ${i ? "text-right tabular-nums" : "break-all"}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
