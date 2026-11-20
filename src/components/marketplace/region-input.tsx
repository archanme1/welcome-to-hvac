import { Input } from "@/components/ui/input";
import { REGIONS } from "@/lib/marketplace/locations";

/** Dropdown when we ship a region list for the country, plain text otherwise. */
export function RegionInput({ country, value, onChange, allowAny, id }: {
  country: string | undefined; value: string; onChange: (v: string) => void; allowAny?: boolean; id?: string;
}) {
  const list = country ? REGIONS[country] : undefined;
  if (list) {
    return (
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
        <option value="">{allowAny ? "All regions" : "Choose…"}</option>
        {list.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
    );
  }
  return <Input id={id} value={value} maxLength={80} placeholder="Province / state / region" onChange={(e) => onChange(e.target.value)} />;
}
