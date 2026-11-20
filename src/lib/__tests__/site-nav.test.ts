import { describe, expect, it } from "vitest";

import { NAV_RAIL, SITE_NAV } from "../site-nav";

describe("sidebar order", () => {
  it("shows the top-level items in the agreed order", () => {
    expect(NAV_RAIL.map((r) => r.label)).toEqual([
      "Home",
      "Start Here",
      "Documentation",
      "AI Tutor",
      "Marketplace",
      "Shop",
      "Engineering Tools & Calculators",
    ]);
  });

  it("links Home to the site root", () => {
    expect(NAV_RAIL[0]).toMatchObject({ to: "/", label: "Home" });
  });

  it("keeps the collapsed rail in the same order as the expanded sidebar", () => {
    const sidebarOrder = SITE_NAV.flatMap((s, i) => {
      if (!s.group) return [s.title];
      // A group appears once, at its first member, under the group name.
      return SITE_NAV.findIndex((x) => x.group === s.group) === i ? [s.group] : [];
    });
    expect(NAV_RAIL.map((r) => r.label)).toEqual(sidebarOrder);
    expect(NAV_RAIL.map((r) => r.to)).toEqual(
      sidebarOrder.map((label) => {
        const match = SITE_NAV.find((s) => (s.group ?? s.title) === label);
        return match!.href;
      }),
    );
  });

  it("gives every rail entry an icon key", () => {
    expect(NAV_RAIL.every((r) => r.iconKey.length > 0)).toBe(true);
  });
});
