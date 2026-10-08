import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Lock, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { computeProCalculator } from "@/lib/calculators.functions";
import { FREE_COMPUTE } from "@/lib/calculators/compute-free";
import { CalcError, type CalcInput, type CalcResult, type CalcValues, type CalculatorMeta } from "@/lib/calculators/types";
import { DIM_BY_ID, convert, formatNumber, unitLabel } from "@/lib/calculators/units";

const selectCls = "h-9 rounded-md border border-input bg-background px-2 text-sm";

function initial(inputs: CalcInput[]) {
  const values: Record<string, string> = {};
  const units: Record<string, string> = {};
  for (const i of inputs) {
    values[i.key] = i.default === undefined || i.default === "" ? "" : String(i.default);
    if (i.dim && i.unit) units[i.key] = i.unit;
  }
  return { values, units };
}

function toCanonical(inputs: CalcInput[], values: Record<string, string>, units: Record<string, string>): CalcValues {
  const out: CalcValues = {};
  for (const i of inputs) {
    const raw = values[i.key] ?? "";
    if (i.type === "select" || i.type === "text") { out[i.key] = raw; continue; }
    if (raw.trim() === "") continue;
    const n = Number(raw);
    if (!Number.isFinite(n)) throw new CalcError(`${i.label}: enter a number.`);
    out[i.key] = i.dim && i.unit ? convert(n, i.dim, units[i.key] ?? i.unit, i.unit) : n;
  }
  return out;
}

export function CalculatorView({ meta }: { meta: CalculatorMeta }) {
  const inputs = meta.inputs ?? [];
  const start = useMemo(() => initial(inputs), [meta.slug]); // eslint-disable-line react-hooks/exhaustive-deps
  const [values, setValues] = useState(start.values);
  const [units, setUnits] = useState(start.units);
  const { user, isPro, loading } = useAuth();
  const compute = useServerFn(computeProCalculator);
  const [result, setResult] = useState<CalcResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(meta.tier === "pro");
  const [busy, setBusy] = useState(false);

  // Display units for defaults: show stored canonical default in the first offered unit.
  useEffect(() => {
    const v = { ...start.values };
    const u = { ...start.units };
    for (const i of inputs) {
      if (i.dim && i.unit && i.units?.length && i.units[0] !== i.unit && v[i.key] !== "") {
        u[i.key] = i.units[0]!;
        v[i.key] = String(Number(convert(Number(v[i.key]), i.dim, i.unit, i.units[0]!).toPrecision(6)));
      }
    }
    setValues(v);
    setUnits(u);
  }, [meta.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let canonical: CalcValues;
    try {
      canonical = toCanonical(inputs, values, units);
    } catch (e) {
      setError((e as Error).message); setResult(null); return;
    }
    if (meta.tier === "free") {
      const fn = FREE_COMPUTE[meta.slug];
      if (!fn) return;
      try { setResult(fn(canonical)); setError(null); } catch (e) { setResult(null); setError(e instanceof CalcError ? e.message : "Check your inputs."); }
      setLocked(false);
      return;
    }
    if (loading) return;
    if (!user || !isPro) { setLocked(true); setResult(null); return; }
    setLocked(false);
    const t = window.setTimeout(async () => {
      setBusy(true);
      try {
        const r = await compute({ data: { slug: meta.slug, values: canonical } });
        if (r.locked) { setLocked(true); setResult(null); }
        else if (r.error) { setError(r.error); setResult(null); }
        else { setResult(r.result ?? null); setError(null); }
      } catch { setError("Couldn't calculate right now. Please try again."); }
      finally { setBusy(false); }
    }, 350);
    return () => window.clearTimeout(t);
  }, [values, units, user, isPro, loading, meta.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  const reset = () => { setValues(start.values); setUnits(start.units); };
  const copy = async () => {
    if (!result) return;
    const text = `${meta.title}\n` + result.outputs.map((o) => `${o.label}: ${o.text ?? `${formatNumber(o.value, o.digits)} ${o.unit ?? ""}`}`).join("\n");
    try { await navigator.clipboard.writeText(text); toast.success("Result copied."); } catch { toast.error("Couldn't copy."); }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <form className="space-y-4 rounded-xl border bg-card p-5" onSubmit={(e) => e.preventDefault()} aria-label={`${meta.short} inputs`}>
        {inputs.map((i) => (
          <div key={i.key} className="space-y-1.5">
            <Label htmlFor={`in-${i.key}`}>{i.label}{i.optional ? <span className="ml-1 text-xs text-muted-foreground">(optional)</span> : null}</Label>
            {i.type === "select" ? (
              <select id={`in-${i.key}`} className={`${selectCls} w-full`} value={values[i.key]} onChange={(e) => setValues({ ...values, [i.key]: e.target.value })}>
                {i.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : (
              <div className="flex gap-2">
                <Input id={`in-${i.key}`} inputMode={i.type === "text" ? "text" : "decimal"} value={values[i.key]} onChange={(e) => setValues({ ...values, [i.key]: e.target.value })} />
                {i.dim && i.unit ? (
                  <select aria-label={`${i.label} unit`} className={`${selectCls} shrink-0`} value={units[i.key]}
                    onChange={(e) => {
                      const next = e.target.value; const prev = units[i.key] ?? i.unit!; const cur = Number(values[i.key]);
                      setUnits({ ...units, [i.key]: next });
                      if (values[i.key] !== "" && Number.isFinite(cur)) setValues({ ...values, [i.key]: String(Number(convert(cur, i.dim!, prev, next).toPrecision(6))) });
                    }}>
                    {(i.units ?? DIM_BY_ID[i.dim]?.units.map((u) => u.id) ?? []).map((u) => <option key={u} value={u}>{unitLabel(i.dim!, u)}</option>)}
                  </select>
                ) : i.suffix ? <span className="flex items-center px-1 text-sm text-muted-foreground">{i.suffix}</span> : null}
              </div>
            )}
            {i.help ? <p className="text-xs text-muted-foreground">{i.help}</p> : null}
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={reset}><RotateCcw className="mr-1.5 h-3.5 w-3.5" />Reset</Button>
      </form>

      <section aria-live="polite" className="rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Result</h2>
          {result ? <Button size="sm" variant="ghost" onClick={() => void copy()}><Copy className="mr-1.5 h-3.5 w-3.5" />Copy</Button> : null}
        </div>
        {locked ? (
          <div className="mt-4 rounded-lg border border-dashed bg-muted/40 p-5 text-center">
            <Lock className="mx-auto h-5 w-5 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">Results for this calculator are part of HVAC Pro</p>
            <p className="mt-1 text-xs text-muted-foreground">You can see the inputs, formula and worked example. Unlock results for every Pro calculator.</p>
            <Button asChild size="sm" className="mt-4"><Link to="/pricing">Unlock with HVAC Pro</Link></Button>
            {!user ? <p className="mt-3 text-xs text-muted-foreground">Already a member? <Link to="/auth" className="underline">Sign in</Link></p> : null}
          </div>
        ) : error ? (
          <p className="mt-3 text-sm text-destructive">{error}</p>
        ) : result ? (
          <dl className={`mt-3 divide-y ${busy ? "opacity-60" : ""}`}>
            {result.outputs.map((o, idx) => (
              <div key={idx} className="flex items-baseline justify-between gap-3 py-2">
                <dt className="text-sm text-muted-foreground">{o.label}</dt>
                <dd className="text-right font-mono text-sm font-semibold">{o.text ?? `${formatNumber(o.value, o.digits)}${o.unit ? ` ${o.unit}` : ""}`}</dd>
              </div>
            ))}
          </dl>
        ) : <p className="mt-3 text-sm text-muted-foreground">{busy ? "Calculating…" : "Enter values to calculate."}</p>}
        {result?.notes?.filter(Boolean).map((n) => <p key={n} className="mt-3 text-xs leading-5 text-muted-foreground">{n}</p>)}
      </section>
    </div>
  );
}
