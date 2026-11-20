import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { CountrySelect } from "./country-select";
import { RegionInput } from "./region-input";
import { MarketplaceDisclaimer } from "./disclaimer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCountryPref } from "@/hooks/use-country-pref";
import { mkCategoriesQuery } from "@/lib/marketplace.functions";
import { CURRENCIES, currencyForCountry } from "@/lib/marketplace/locations";
import { CONDITIONS, LISTING_TYPES, MAX_PHOTOS, MAX_PHOTO_BYTES, PHOTO_TYPES, listingInputSchema } from "@/lib/marketplace/shared";

type Existing = { id: string; path: string; url: string };
type Form = {
  title: string; category_id: string; price: string; currency: string; negotiable: boolean; description: string;
  condition: string; listing_type: string; country: string; region: string; city: string;
  brand: string; model_number: string; approx_age: string; pickup: boolean; delivery: boolean; specs: string;
};
const EMPTY: Form = {
  title: "", category_id: "", price: "", currency: "CAD", negotiable: false, description: "", condition: "used",
  listing_type: "for_sale", country: "CA", region: "", city: "", brand: "", model_number: "", approx_age: "",
  pickup: true, delivery: false, specs: "",
};

export function ListingForm({ listingId }: { listingId?: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const pref = useCountryPref();
  const { data: cats } = useQuery(mkCategoriesQuery);
  const [f, setF] = useState<Form>(EMPTY);
  const [existing, setExisting] = useState<Existing[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(!listingId);

  // New listing: start from the remembered country.
  useEffect(() => {
    if (listingId || !pref.ready || !pref.country) return;
    setF((p) => ({ ...p, country: pref.country!, currency: currencyForCountry(pref.country!) }));
  }, [pref.ready, pref.country, listingId]);

  useEffect(() => {
    if (!listingId) return;
    void (async () => {
      const { data: l } = await supabase.from("marketplace_listings").select("*").eq("id", listingId).maybeSingle();
      if (!l) { toast.error("Listing not found."); return void navigate({ to: "/marketplace/mine" }); }
      setF({
        title: l.title, category_id: l.category_id, price: String(l.price), currency: l.currency, negotiable: l.negotiable,
        description: l.description, condition: l.condition, listing_type: l.listing_type, country: l.country, region: l.region,
        city: l.city, brand: l.brand ?? "", model_number: l.model_number ?? "", approx_age: l.approx_age ?? "",
        pickup: l.pickup, delivery: l.delivery, specs: l.specs ?? "",
      });
      const { data: imgs } = await supabase.from("marketplace_listing_images").select("id, path").eq("listing_id", listingId).order("sort_order");
      const paths = (imgs ?? []).map((i) => i.path);
      const { data: signed } = paths.length ? await supabase.storage.from("marketplace").createSignedUrls(paths, 3600) : { data: [] };
      setExisting((imgs ?? []).map((i) => ({ ...i, url: signed?.find((s) => s.path === i.path)?.signedUrl ?? "" })));
      setLoaded(true);
    })();
  }, [listingId, navigate]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));
  const parents = (cats ?? []).filter((c) => !c.parent_id);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const ok: File[] = [];
    for (const file of Array.from(list)) {
      if (!PHOTO_TYPES.includes(file.type)) { toast.error(`${file.name}: use JPG, PNG or WebP.`); continue; }
      if (file.size > MAX_PHOTO_BYTES) { toast.error(`${file.name}: photos must be under 5 MB.`); continue; }
      ok.push(file);
    }
    setFiles((p) => [...p, ...ok].slice(0, MAX_PHOTOS - existing.length));
  };

  const submit = async (status: "active" | "draft") => {
    if (!user) return;
    const parsed = listingInputSchema.safeParse({
      ...f, price: f.listing_type === "free" ? 0 : f.price === "" ? Number.NaN : Number(f.price),
      brand: f.brand || undefined, model_number: f.model_number || undefined, approx_age: f.approx_age || undefined, specs: f.specs || undefined,
    });
    const errs: Record<string, string> = {};
    if (!parsed.success) for (const i of parsed.error.issues) errs[String(i.path[0])] ??= i.message;
    if (status === "active" && existing.length + files.length === 0) errs["photos"] = "Add at least one photo.";
    setErrors(errs);
    if (!parsed.success || Object.keys(errs).length) return void toast.error("Please fix the highlighted fields.");
    setBusy(true);
    const v = parsed.data;
    const row = { ...v, brand: v.brand ?? null, model_number: v.model_number ?? null, approx_age: v.approx_age ?? null, specs: v.specs ?? null, status };
    const res = listingId
      ? await supabase.from("marketplace_listings").update(row).eq("id", listingId).select("id, slug").single()
      : await supabase.from("marketplace_listings").insert({ ...row, seller_id: user.id }).select("id, slug").single();
    if (res.error || !res.data) {
      setBusy(false);
      return void toast.error(res.error?.message.includes("limit") ? res.error.message : "Couldn't save. Make sure your Pro membership is active.");
    }
    const id = res.data.id;
    let order = existing.length;
    for (const file of files) {
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${user.id}/${id}/${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage.from("marketplace").upload(path, file, { contentType: file.type });
      if (up.error) { toast.error(`Photo upload failed: ${file.name}`); continue; }
      await supabase.from("marketplace_listing_images").insert({ listing_id: id, path, sort_order: order++ });
    }
    void pref.save(v.country);
    setBusy(false);
    toast.success(status === "draft" ? "Draft saved." : "Listing published.");
    void navigate({ to: "/marketplace/mine" });
  };

  const removeExisting = async (img: Existing) => {
    await supabase.from("marketplace_listing_images").delete().eq("id", img.id);
    await supabase.storage.from("marketplace").remove([img.path]);
    setExisting((p) => p.filter((x) => x.id !== img.id));
  };

  if (!loaded) return <p className="text-sm text-muted-foreground">Loading…</p>;
  const err = (k: string) => (errors[k] ? <p className="text-xs text-destructive">{errors[k]}</p> : null);
  const sel = "h-9 w-full rounded-md border border-input bg-background px-2 text-sm";

  return (
    <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); void submit("active"); }}>
      <div className="space-y-1.5"><Label htmlFor="t">Listing title *</Label><Input id="t" maxLength={120} value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Used 3-ton heat pump condenser, R-410A" />{err("title")}</div>
      <div className="space-y-1.5">
        <Label htmlFor="cat">Trade / category *</Label>
        <select id="cat" className={sel} value={f.category_id} onChange={(e) => set("category_id", e.target.value)}>
          <option value="">Choose a category…</option>
          {parents.map((p) => (
            <optgroup key={p.id} label={p.title}>
              <option value={p.id}>{p.title} — general</option>
              {(cats ?? []).filter((c) => c.parent_id === p.id).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </optgroup>
          ))}
        </select>{err("category_id")}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="lt">Listing type *</Label>
          <select id="lt" className={sel} value={f.listing_type} onChange={(e) => set("listing_type", e.target.value)}>{LISTING_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
        <div className="space-y-1.5"><Label htmlFor="cond">Condition *</Label>
          <select id="cond" className={sel} value={f.condition} onChange={(e) => set("condition", e.target.value)}>{CONDITIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
      </div>
      {f.listing_type !== "free" ? (
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <div className="space-y-1.5"><Label htmlFor="p">{f.listing_type === "wanted" ? "Budget (up to) *" : "Price *"}</Label><Input id="p" inputMode="decimal" value={f.price} onChange={(e) => set("price", e.target.value.replace(/[^\d.]/g, ""))} />{err("price")}</div>
          <div className="space-y-1.5"><Label htmlFor="cur">Currency</Label><select id="cur" className={sel} value={f.currency} onChange={(e) => set("currency", e.target.value)}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select></div>
          <label className="col-span-2 flex items-center gap-2 text-sm"><Checkbox checked={f.negotiable} onCheckedChange={(v) => set("negotiable", v === true)} />Price is negotiable</label>
        </div>
      ) : null}
      <div className="space-y-1.5"><Label htmlFor="d">Short description *</Label><Textarea id="d" rows={5} maxLength={5000} value={f.description} onChange={(e) => set("description", e.target.value)} />{err("description")}</div>
      <fieldset className="space-y-3 rounded-lg border p-4">
        <legend className="px-1 text-sm font-medium">Location *</legend>
        <div className="space-y-1.5"><Label>Country</Label><CountrySelect value={f.country} onChange={(c) => c && setF((p) => ({ ...p, country: c, region: "", currency: currencyForCountry(c) }))} />{err("country")}</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="r">Province / state / region</Label><RegionInput id="r" country={f.country} value={f.region} onChange={(v) => set("region", v)} />{err("region")}</div>
          <div className="space-y-1.5"><Label htmlFor="city">City</Label><Input id="city" maxLength={80} value={f.city} onChange={(e) => set("city", e.target.value)} />{err("city")}</div>
        </div>
        <p className="text-xs text-muted-foreground">Only your city and region are shown. Never enter a street address.</p>
      </fieldset>
      <div className="space-y-1.5">
        <Label htmlFor="ph">Photos * (up to {MAX_PHOTOS}, JPG/PNG/WebP, 5 MB each)</Label>
        <div className="flex flex-wrap gap-2">
          {existing.map((img) => (
            <div key={img.id} className="relative h-20 w-24 overflow-hidden rounded border">
              <img src={img.url} alt="Listing photo" className="h-full w-full object-cover" />
              <button type="button" aria-label="Remove photo" onClick={() => void removeExisting(img)} className="absolute right-0.5 top-0.5 rounded bg-background/90 p-0.5"><X className="h-3 w-3" /></button>
            </div>
          ))}
          {files.map((file, i) => (
            <div key={`${file.name}-${i}`} className="relative h-20 w-24 overflow-hidden rounded border">
              <img src={URL.createObjectURL(file)} alt="New photo" className="h-full w-full object-cover" />
              <button type="button" aria-label="Remove photo" onClick={() => setFiles((p) => p.filter((_, j) => j !== i))} className="absolute right-0.5 top-0.5 rounded bg-background/90 p-0.5"><X className="h-3 w-3" /></button>
            </div>
          ))}
        </div>
        {existing.length + files.length < MAX_PHOTOS ? <Input id="ph" type="file" accept={PHOTO_TYPES.join(",")} multiple onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} /> : null}
        {err("photos")}
      </div>
      <details className="rounded-lg border p-4">
        <summary className="cursor-pointer text-sm font-medium">Optional details</summary>
        <div className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5"><Label htmlFor="b">Brand</Label><Input id="b" maxLength={80} value={f.brand} onChange={(e) => set("brand", e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="m">Model number</Label><Input id="m" maxLength={80} value={f.model_number} onChange={(e) => set("model_number", e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="a">Approximate age</Label><Input id="a" maxLength={40} value={f.approx_age} onChange={(e) => set("approx_age", e.target.value)} placeholder="e.g. 5 years" /></div>
          </div>
          <div className="flex gap-6 text-sm">
            <label className="flex items-center gap-2"><Checkbox checked={f.pickup} onCheckedChange={(v) => set("pickup", v === true)} />Pickup available</label>
            <label className="flex items-center gap-2"><Checkbox checked={f.delivery} onCheckedChange={(v) => set("delivery", v === true)} />Delivery available</label>
          </div>
          <div className="space-y-1.5"><Label htmlFor="s">Specifications</Label><Textarea id="s" rows={3} maxLength={2000} value={f.specs} onChange={(e) => set("specs", e.target.value)} placeholder="Tonnage, voltage, refrigerant type, dimensions…" /></div>
        </div>
      </details>
      <MarketplaceDisclaimer withProhibited />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : listingId ? "Save and publish" : "Publish listing"}</Button>
        <Button type="button" variant="outline" disabled={busy} onClick={() => void submit("draft")}>Save as draft</Button>
      </div>
    </form>
  );
}
