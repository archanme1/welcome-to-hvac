import { describe, expect, it } from "vitest";

import { COUNTRIES, currencyForCountry } from "../locations";
import { exploreSearchSchema, formatPrice, listingInputSchema } from "../shared";

const valid = {
  title: "Used 3-ton heat pump", category_id: "00000000-0000-4000-8000-000000000000", price: 900, currency: "CAD",
  negotiable: false, description: "Works well, pulled during upgrade.", condition: "used", listing_type: "for_sale",
  country: "CA", region: "Ontario", city: "Toronto", pickup: true, delivery: false,
} as const;

describe("marketplace rules", () => {
  it("defaults Canadian listings to CAD", () => expect(currencyForCountry("CA")).toBe("CAD"));
  it("uses the local currency for other countries", () => {
    expect(currencyForCountry("US")).toBe("USD");
    expect(currencyForCountry("DE")).toBe("EUR");
  });
  it("ships a worldwide country list", () => {
    expect(COUNTRIES.length).toBeGreaterThan(190);
    expect(COUNTRIES.some((c) => c.code === "CA")).toBe(true);
  });
  it("shows Free listings as Free regardless of price", () => expect(formatPrice(50, "CAD", "free")).toBe("Free"));
  it("always shows the currency code on prices", () => expect(formatPrice(900, "USD", "for_sale")).toContain("USD"));
  it("requires a price above zero for For Sale listings", () => {
    expect(listingInputSchema.safeParse({ ...valid, price: 0 }).success).toBe(false);
    expect(listingInputSchema.safeParse({ ...valid, listing_type: "free", price: 0 }).success).toBe(true);
  });
  it("rejects listings without a city", () => expect(listingInputSchema.safeParse({ ...valid, city: " " }).success).toBe(false));
  it("drops invalid filter values from the URL", () => {
    const s = exploreSearchSchema.parse({ country: "canada", condition: "broken", page: "-3" });
    expect(s.country).toBeUndefined();
    expect(s.condition).toBeUndefined();
    expect(s.page).toBe(1);
  });
});
