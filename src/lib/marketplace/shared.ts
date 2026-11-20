import { z } from "zod";

export const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "used", label: "Used" },
  { value: "refurbished", label: "Refurbished" },
  { value: "for_parts", label: "For Parts" },
] as const;
export const LISTING_TYPES = [
  { value: "for_sale", label: "For Sale" },
  { value: "free", label: "Free" },
  { value: "wanted", label: "Wanted" },
] as const;
export const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
] as const;
export const STATUSES = ["draft", "active", "sold", "unavailable", "removed"] as const;
export type ListingStatus = (typeof STATUSES)[number];

export const PAGE_SIZE = 24;
export const MAX_PHOTOS = 8;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const UPGRADE_MESSAGE =
  "Want to contact sellers and participate in the trades marketplace? Upgrade to WelcomeToHVAC Pro to unlock marketplace interactions.";
export const DISCLAIMER =
  "WelcomeToHVAC provides a platform for users to discover and connect with other buyers and sellers. We do not process payments or manage transactions. Buyers and sellers are responsible for independently verifying product condition, compatibility, ownership, pricing, and applicable safety or regulatory requirements. Arrange payments and exchanges at your own discretion and take appropriate precautions.";
export const PROHIBITED_NOTE =
  "Not allowed: stolen goods, recalled or unsafe equipment, items with removed safety devices, and regulated refrigerants offered to buyers who don't hold the certification your jurisdiction requires (for example ODS / 313A certification in Canada or EPA 608 in the US).";

export const conditionLabel = (v: string) => CONDITIONS.find((c) => c.value === v)?.label ?? v;
export const typeLabel = (v: string) => LISTING_TYPES.find((c) => c.value === v)?.label ?? v;

export function formatPrice(price: number, currency: string, listingType: string): string {
  if (listingType === "free") return "Free";
  const amount = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: price % 1 === 0 ? 0 : 2,
  }).format(price);
  const label = `${amount} ${currency}`;
  return listingType === "wanted" ? `Wanted · up to ${label}` : label;
}

const optNum = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
  z.number().min(0).max(10_000_000).optional(),
);
const optStr = (max: number) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined), z.string().optional());

/** URL search state for Explore. Unknown or invalid values are dropped. */
export const exploreSearchSchema = z.object({
  q: optStr(100),
  category: optStr(80),
  min: optNum,
  max: optNum,
  condition: z.enum(["new", "used", "refurbished", "for_parts"]).optional().catch(undefined),
  type: z.enum(["for_sale", "free", "wanted"]).optional().catch(undefined),
  country: z.preprocess((v) => (typeof v === "string" && /^[A-Z]{2}$/.test(v) ? v : undefined), z.string().optional()),
  region: optStr(80),
  city: optStr(80),
  sort: z.enum(["newest", "oldest", "price_asc", "price_desc"]).optional().catch(undefined),
  page: z.preprocess((v) => Math.max(1, Math.floor(Number(v) || 1)), z.number()).optional(),
});
export type ExploreSearch = z.infer<typeof exploreSearchSchema>;

export const listingInputSchema = z
  .object({
    title: z.string().trim().min(5, "Title needs at least 5 characters.").max(120),
    category_id: z.string().uuid("Choose a category."),
    price: z.number({ message: "Enter a price." }).min(0).max(10_000_000),
    currency: z.string().regex(/^[A-Z]{3}$/),
    negotiable: z.boolean(),
    description: z.string().trim().min(10, "Description needs at least 10 characters.").max(5000),
    condition: z.enum(["new", "used", "refurbished", "for_parts"]),
    listing_type: z.enum(["for_sale", "free", "wanted"]),
    country: z.string().regex(/^[A-Z]{2}$/, "Choose a country."),
    region: z.string().trim().min(1, "Enter a province, state or region.").max(80),
    city: z.string().trim().min(1, "Enter a city.").max(80),
    brand: z.string().trim().max(80).optional(),
    model_number: z.string().trim().max(80).optional(),
    approx_age: z.string().trim().max(40).optional(),
    pickup: z.boolean(),
    delivery: z.boolean(),
    specs: z.string().trim().max(2000).optional(),
  })
  .refine((v) => v.listing_type !== "for_sale" || v.price > 0, {
    message: "Enter a price above zero, or choose Free.",
    path: ["price"],
  });
export type ListingInput = z.infer<typeof listingInputSchema>;

export const COUNTRY_PREF_KEY = "mkt-country";
