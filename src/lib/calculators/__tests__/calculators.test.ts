import { describe, expect, it } from "vitest";
import { convert } from "../units";
import { FREE_COMPUTE } from "../compute-free";
import { PRO_COMPUTE } from "../compute-pro";
import { CALCULATORS } from "../registry";

const out = (slug: string, v: Record<string, number | string>, i = 0) =>
  (PRO_COMPUTE[slug] ?? FREE_COMPUTE[slug])!(v).outputs[i]!.value;

describe("units", () => {
  it("converts common HVAC units", () => {
    expect(convert(14.696, "pressure", "psi", "kPa")).toBeCloseTo(101.325, 2);
    expect(convert(100, "temperature", "C", "F")).toBeCloseTo(212, 6);
    expect(convert(12000, "power", "BTUh", "ton")).toBeCloseTo(1, 4);
    expect(convert(1, "flow", "cfm", "Ls")).toBeCloseTo(0.4719, 3);
    expect(convert(20, "rvalue", "R", "RSI")).toBeCloseTo(3.522, 2);
    expect(convert(500, "pressure", "micron", "psi")).toBeCloseTo(0.00967, 4);
  });
});

describe("calculators", () => {
  it("every non-pending calc has a compute function", () => {
    for (const c of CALCULATORS.filter((c) => c.kind === "calc")) {
      expect(PRO_COMPUTE[c.slug] ?? FREE_COMPUTE[c.slug], c.slug).toBeTruthy();
    }
  });
  it("hand-checked examples", () => {
    expect(out("sensible-heat", { cfm: 1200, dt: 20 })).toBeCloseTo(25920, 0);
    expect(out("ohms-law", { V: 240, R: 24 }, 1)).toBeCloseTo(10, 6);
    expect(out("superheat", { line: 52, sat: 40 })).toBe(12);
    expect(out("voltage-drop", { phase: "1", material: "copper", awg: "10", I: 24, L: 100, V: 240 })).toBeCloseTo(5.965, 2);
    expect(out("three-phase-power", { V: 208, I: 20, pf: 0.85 })).toBeCloseTo(6.124, 2);
    expect(out("capacitor-mfd", { I: 3.8, V: 380, f: 60 })).toBeCloseTo(26.53, 1);
    expect(out("equivalent-duct-diameter", { a: 12, b: 8 })).toBeCloseTo(10.7, 1);
    expect(out("dew-point", { t: 75, rh: 50 })).toBeCloseTo(55.1, 0);
    expect(out("hydronic-flow", { btuh: 100000, dt: 20 })).toBe(10);
    expect(out("fan-affinity", { rpm1: 1000, rpm2: 1100, cfm1: 1000, sp1: 0, bhp1: 1 }, 1)).toBeCloseTo(1.331, 3);
    expect(out("pressure-ratio", { suction: 118, discharge: 340, atm: 14.696 })).toBeCloseTo(2.673, 2);
  });
});
