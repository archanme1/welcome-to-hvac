import { useState } from "react";
import { Printer, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { Checklist } from "@/lib/calculators/checklists";

export function ChecklistView({ checklist }: { checklist: Checklist }) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const total = checklist.items.reduce((a, s) => a + s.items.length, 0);
  const count = Object.values(done).filter(Boolean).length;
  return (
    <div className="rounded-xl border bg-card p-5 print:border-0 print:p-0">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <p className="text-sm text-muted-foreground">{count} of {total} checked</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setDone({})}><RotateCcw className="mr-1.5 h-3.5 w-3.5" />Reset</Button>
          <Button size="sm" onClick={() => window.print()}><Printer className="mr-1.5 h-3.5 w-3.5" />Print / Save PDF</Button>
        </div>
      </div>
      <div className="mt-4 space-y-5">
        {checklist.items.map((s) => (
          <section key={s.section}>
            <h2 className="text-sm font-semibold">{s.section}</h2>
            <ul className="mt-2 space-y-2">
              {s.items.map((item) => {
                const id = `${s.section}-${item}`;
                return (
                  <li key={id} className="flex items-start gap-2.5">
                    <Checkbox id={id} checked={!!done[id]} onCheckedChange={(v) => setDone({ ...done, [id]: v === true })} className="mt-0.5" />
                    <label htmlFor={id} className="text-sm leading-6">{item}</label>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
