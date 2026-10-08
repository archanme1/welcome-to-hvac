import { useMemo, useState } from "react";
import { ArrowLeftRight, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DIMENSIONS, DIM_BY_ID, convert, formatNumber } from "@/lib/calculators/units";

const selectCls = "h-9 w-full rounded-md border border-input bg-background px-2 text-sm";

export function UnitConverter() {
  const [dim, setDim] = useState("pressure");
  const d = DIM_BY_ID[dim]!;
  const [from, setFrom] = useState("psi");
  const [to, setTo] = useState("kPa");
  const [value, setValue] = useState("14.7");

  const n = Number(value);
  const valid = value.trim() !== "" && Number.isFinite(n);
  const result = useMemo(() => (valid ? convert(n, dim, from, to) : NaN), [n, dim, from, to, valid]);
  const all = useMemo(() => (valid ? d.units.map((u) => ({ u, v: convert(n, dim, from, u.id) })) : []), [n, dim, from, valid, d]);

  const pickDim = (id: string) => {
    const next = DIM_BY_ID[id]!;
    setDim(id); setFrom(next.units[0]!.id); setTo(next.units[1]?.id ?? next.units[0]!.id);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-card p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="uc-dim">Quantity</Label>
            <select id="uc-dim" className={selectCls} value={dim} onChange={(e) => pickDim(e.target.value)}>
              {DIMENSIONS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="uc-val">Value</Label>
            <Input id="uc-val" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="uc-from">From</Label>
            <select id="uc-from" className={selectCls} value={from} onChange={(e) => setFrom(e.target.value)}>
              {d.units.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <Button type="button" variant="outline" size="sm" onClick={() => { setFrom(to); setTo(from); }}><ArrowLeftRight className="mr-1.5 h-3.5 w-3.5" />Swap</Button>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="uc-to">To</Label>
            <select id="uc-to" className={selectCls} value={to} onChange={(e) => setTo(e.target.value)}>
              {d.units.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between rounded-lg bg-muted/50 p-4" aria-live="polite">
          <p className="font-mono text-lg font-semibold">{valid ? `${formatNumber(result, 6)} ${d.units.find((u) => u.id === to)?.label}` : "Enter a number"}</p>
          {valid ? <Button size="sm" variant="ghost" onClick={() => void navigator.clipboard.writeText(String(result)).then(() => toast.success("Copied."))}><Copy className="h-3.5 w-3.5" /></Button> : null}
        </div>
        {dim === "temperature" ? <p className="mt-2 text-xs text-muted-foreground">Converting a temperature difference? Use "Temperature difference" — a 10 °C change is 18 °F, not 50 °F.</p> : null}
      </div>
      {all.length ? (
        <div className="rounded-xl border bg-card p-5">
          <h2 className="text-sm font-semibold">All {d.label.toLowerCase()} units</h2>
          <dl className="mt-2 divide-y">
            {all.map(({ u, v }) => (
              <div key={u.id} className="flex justify-between py-1.5 text-sm"><dt className="text-muted-foreground">{u.label}</dt><dd className="font-mono">{formatNumber(v, 6)}</dd></div>
            ))}
          </dl>
        </div>
      ) : null}
    </div>
  );
}
