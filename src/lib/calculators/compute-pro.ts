import { CalcError, has, need, num, type CalcOutput, type ComputeFn } from "./types";

/**
 * HVAC Pro calculations. Only the server function imports this module,
 * so results are computed after the subscription check.
 */
const dF = (label: string, f: number): CalcOutput[] => [
  { label: `${label} (°F)`, value: f, unit: "Δ°F" },
  { label: `${label} (K / °C)`, value: (f * 5) / 9, unit: "K" },
];
const kw = (btuh: number): CalcOutput => ({ label: "Kilowatts", value: btuh * 0.29307107 / 1000, unit: "kW" });
const pos = (x: number, msg: string) => need(Number.isFinite(x) && x > 0, msg);

// NEC Chapter 9 Table 8 circular-mil areas (conductor size → kcmil × 1000).
export const AWG_CMIL: Record<string, number> = {
  "14": 4110, "12": 6530, "10": 10380, "8": 16510, "6": 26240, "4": 41740, "3": 52620,
  "2": 66360, "1": 83690, "1/0": 105600, "2/0": 133100, "3/0": 167800, "4/0": 211600,
};
// Approximate resistivity constants K (Ω·cmil/ft) at ~75 °C.
const K_MATERIAL: Record<string, number> = { copper: 12.9, aluminum: 21.2 };

const EXPANSION_PER_F: Record<string, number> = {
  copper: 9.4e-6, steel: 6.5e-6, stainless: 9.6e-6, pvc: 28e-6, cpvc: 38e-6, pex: 9.3e-5,
};

function dewPointC(tC: number, rh: number) {
  const a = 17.62, b = 243.12;
  const g = Math.log(rh / 100) + (a * tC) / (b + tC);
  return (b * g) / (a - g);
}
const cToF = (c: number) => (c * 9) / 5 + 32;
const fToC = (f: number) => ((f - 32) * 5) / 9;

export const PRO_COMPUTE: Record<string, ComputeFn> = {
  /* ---------------- Fundamentals ---------------- */
  "sensible-heat": (v) => {
    const cfm = num(v, "cfm"), dt = num(v, "dt");
    pos(cfm, "Enter airflow."); need(Number.isFinite(dt), "Enter a temperature difference.");
    const q = 1.08 * cfm * dt;
    return { outputs: [{ label: "Sensible heat", value: q, unit: "BTU/h" }, kw(q), { label: "Tons", value: q / 12000, unit: "tons" }] };
  },
  "latent-heat": (v) => {
    const cfm = num(v, "cfm"), dw = num(v, "dw");
    pos(cfm, "Enter airflow."); need(Number.isFinite(dw), "Enter the moisture difference.");
    const q = 0.68 * cfm * dw;
    return { outputs: [{ label: "Latent heat", value: q, unit: "BTU/h" }, kw(q)] };
  },
  "total-heat": (v) => {
    const cfm = num(v, "cfm"), dh = num(v, "dh");
    pos(cfm, "Enter airflow."); need(Number.isFinite(dh), "Enter the enthalpy difference.");
    const q = 4.5 * cfm * dh;
    return { outputs: [{ label: "Total heat", value: q, unit: "BTU/h" }, kw(q), { label: "Tons", value: q / 12000, unit: "tons" }] };
  },
  "heat-transfer": (v) => {
    const m = num(v, "m"), cp = num(v, "cp"), dt = num(v, "dt");
    pos(m, "Enter mass."); pos(cp, "Enter specific heat."); need(Number.isFinite(dt), "Enter ΔT.");
    const j = m * cp * dt;
    return { outputs: [{ label: "Heat", value: j / 1000, unit: "kJ" }, { label: "Heat", value: j / 1055.05585, unit: "BTU" }, { label: "Heat", value: j / 3.6e6, unit: "kWh" }] };
  },
  "energy-cost": (v) => {
    const p = num(v, "kw"), h = num(v, "hours"), d = num(v, "days"), r = num(v, "rate");
    pos(p, "Enter power."); pos(h, "Enter hours per day."); pos(d, "Enter days.");
    const kwh = p * h * d;
    return { outputs: [{ label: "Energy", value: kwh, unit: "kWh" }, { label: "Cost", value: kwh * (r || 0), unit: "$" }] };
  },
  "efficiency-converter": (v) => {
    const val = num(v, "value"), from = String(v["from"]);
    pos(val, "Enter a rating.");
    const cop = from === "cop" ? val : from === "eer" ? val / 3.412 : from === "kwton" ? 12 / (val * 3.412) : NaN;
    need(Number.isFinite(cop), "Choose a rating type.");
    const eer = cop * 3.412;
    return {
      outputs: [
        { label: "COP", value: cop, digits: 3 },
        { label: "EER", value: eer, unit: "BTU/W·h", digits: 3 },
        { label: "kW per ton", value: 12 / eer, unit: "kW/ton", digits: 3 },
      ],
      notes: ["SEER/SEER2 and HSPF are seasonal ratings from standardized tests and cannot be converted exactly from a single-point COP/EER."],
    };
  },

  /* ---------------- Refrigeration & heat pumps ---------------- */
  superheat: (v) => {
    const line = num(v, "line"), sat = num(v, "sat");
    need(Number.isFinite(line) && Number.isFinite(sat), "Enter both temperatures.");
    const sh = line - sat;
    return { outputs: dF("Superheat", sh), notes: sh < 0 ? ["Negative superheat means the line is below saturation — recheck readings; liquid may be present."] : [] };
  },
  subcooling: (v) => {
    const sat = num(v, "sat"), line = num(v, "line");
    need(Number.isFinite(line) && Number.isFinite(sat), "Enter both temperatures.");
    const sc = sat - line;
    return { outputs: dF("Subcooling", sc), notes: sc < 0 ? ["Negative subcooling means the line is above condensing saturation — recheck readings."] : [] };
  },
  "pressure-ratio": (v) => {
    const s = num(v, "suction"), d = num(v, "discharge"), atm = num(v, "atm") || 14.696;
    need(Number.isFinite(s) && Number.isFinite(d), "Enter both gauge pressures.");
    const sa = s + atm, da = d + atm;
    pos(sa, "Absolute suction pressure must be above zero.");
    return { outputs: [{ label: "Compression ratio", value: da / sa, digits: 3 }, { label: "Suction (absolute)", value: sa, unit: "psia" }, { label: "Discharge (absolute)", value: da, unit: "psia" }] };
  },
  "refrigeration-capacity": (v) => {
    const m = num(v, "m"), h1 = num(v, "h1"), h2 = num(v, "h2");
    pos(m, "Enter mass flow."); need(Number.isFinite(h1) && Number.isFinite(h2), "Enter both enthalpies.");
    const kwv = m * (h2 - h1);
    return { outputs: [{ label: "Capacity", value: kwv, unit: "kW" }, { label: "Capacity", value: kwv * 3412.14, unit: "BTU/h" }, { label: "Capacity", value: (kwv * 3412.14) / 12000, unit: "tons" }, { label: "Enthalpy difference", value: h2 - h1, unit: "kJ/kg" }] };
  },
  "evaporator-td": (v) => {
    const air = num(v, "air"), sat = num(v, "sat");
    need(Number.isFinite(air) && Number.isFinite(sat), "Enter both temperatures.");
    return { outputs: dF("Coil temperature difference", air - sat) };
  },
  "condenser-split": (v) => {
    const sat = num(v, "sat"), amb = num(v, "ambient");
    need(Number.isFinite(sat) && Number.isFinite(amb), "Enter both temperatures.");
    return { outputs: dF("Condenser split (approach)", sat - amb) };
  },
  "refrigerant-line-velocity": (v) => {
    const m = num(v, "m"), rho = num(v, "rho"), d = num(v, "d");
    pos(m, "Enter mass flow."); pos(rho, "Enter density."); pos(d, "Enter inside diameter.");
    const area = (Math.PI * d * d) / 4; // m²
    const vel = m / (rho * area);
    return { outputs: [{ label: "Velocity", value: vel, unit: "m/s" }, { label: "Velocity", value: vel / 0.00508, unit: "ft/min" }] };
  },
  "heat-pump-cop": (v) => {
    const out = num(v, "output"), inp = num(v, "input");
    pos(out, "Enter heat output."); pos(inp, "Enter electrical input.");
    const cop = out / inp;
    return { outputs: [{ label: "COP", value: cop, digits: 3 }, { label: "Equivalent EER", value: cop * 3.412, digits: 3 }, { label: "Heat delivered per kWh", value: cop, unit: "kWh heat" }] };
  },
  "heat-pump-cost": (v) => {
    const heat = num(v, "heat"), cop = num(v, "cop"), rate = num(v, "rate");
    pos(heat, "Enter heat needed."); pos(cop, "Enter COP."); pos(rate, "Enter electricity rate.");
    const hpKwh = heat / cop;
    return {
      outputs: [
        { label: "Heat pump electricity", value: hpKwh, unit: "kWh" },
        { label: "Heat pump cost", value: hpKwh * rate, unit: "$" },
        { label: "Electric resistance cost", value: heat * rate, unit: "$" },
        { label: "Savings vs resistance", value: heat * rate - hpKwh * rate, unit: "$" },
      ],
    };
  },
  "backup-heat": (v) => {
    const k = num(v, "kw"), volts = num(v, "volts");
    pos(k, "Enter heater kW."); pos(volts, "Enter voltage.");
    return { outputs: [{ label: "Current", value: (k * 1000) / volts, unit: "A" }, { label: "Heat output", value: k * 3412.14, unit: "BTU/h" }], notes: ["Rated kW is at the rated voltage; at lower voltage, output drops with the square of the voltage ratio."] };
  },

  /* ---------------- Electrical ---------------- */
  "single-phase-power": (v) => {
    const V = num(v, "V"), I = num(v, "I"), pf = has(v, "pf") ? num(v, "pf") : 1;
    pos(V, "Enter voltage."); pos(I, "Enter current"); need(pf > 0 && pf <= 1, "Power factor must be between 0 and 1.");
    return { outputs: [{ label: "Real power", value: V * I * pf, unit: "W" }, { label: "Apparent power", value: V * I, unit: "VA" }] };
  },
  "three-phase-power": (v) => {
    const V = num(v, "V"), I = num(v, "I"), pf = has(v, "pf") ? num(v, "pf") : 1;
    pos(V, "Enter line-to-line voltage."); pos(I, "Enter line current."); need(pf > 0 && pf <= 1, "Power factor must be between 0 and 1.");
    const va = Math.sqrt(3) * V * I;
    return { outputs: [{ label: "Real power", value: (va * pf) / 1000, unit: "kW" }, { label: "Apparent power", value: va / 1000, unit: "kVA" }] };
  },
  "three-phase-current": (v) => {
    const P = num(v, "kw"), V = num(v, "V"), pf = has(v, "pf") ? num(v, "pf") : 1;
    pos(P, "Enter power."); pos(V, "Enter voltage."); need(pf > 0 && pf <= 1, "Power factor must be between 0 and 1.");
    return { outputs: [{ label: "Line current", value: (P * 1000) / (Math.sqrt(3) * V * pf), unit: "A" }] };
  },
  "voltage-drop": (v) => {
    const I = num(v, "I"), L = num(v, "L"), V = num(v, "V");
    const cm = AWG_CMIL[String(v["awg"])], K = K_MATERIAL[String(v["material"])];
    pos(I, "Enter current."); pos(L, "Enter one-way length."); pos(V, "Enter source voltage");
    need(cm && K, "Choose conductor size and material.");
    const factor = String(v["phase"]) === "3" ? Math.sqrt(3) : 2;
    const vd = (factor * K * I * L) / cm;
    return {
      outputs: [{ label: "Voltage drop", value: vd, unit: "V" }, { label: "Voltage drop", value: (vd / V) * 100, unit: "%" }, { label: "Voltage at load", value: V - vd, unit: "V" }],
      notes: ["Uses the K-factor method with NEC Chapter 9 Table 8 conductor areas. Confirm with CEC/NEC tables for your installation."],
    };
  },
  "wire-resistance": (v) => {
    const L = num(v, "L");
    const cm = AWG_CMIL[String(v["awg"])], K = K_MATERIAL[String(v["material"])];
    pos(L, "Enter length."); need(cm && K, "Choose conductor size and material.");
    const r = (K * L) / cm;
    return { outputs: [{ label: "Resistance", value: r, unit: "Ω" }, { label: "Per 1,000 ft", value: (K * 1000) / cm, unit: "Ω/kft" }] };
  },
  "motor-current": (v) => {
    const hp = num(v, "hp"), V = num(v, "V"), eff = num(v, "eff") / 100, pf = num(v, "pf"), ph = String(v["phase"]);
    pos(hp, "Enter horsepower."); pos(V, "Enter voltage."); need(eff > 0 && eff <= 1, "Efficiency 1–100%."); need(pf > 0 && pf <= 1, "Power factor 0–1.");
    const w = hp * 745.7;
    const I = ph === "3" ? w / (Math.sqrt(3) * V * eff * pf) : w / (V * eff * pf);
    return { outputs: [{ label: "Estimated full-load current", value: I, unit: "A" }, { label: "Electrical input", value: w / eff / 1000, unit: "kW" }], notes: ["Estimate only. Size conductors and protection from the nameplate and code tables (CEC Table 44/45, NEC 430.248/250), not this value."] };
  },
  "motor-efficiency": (v) => {
    const hp = num(v, "hp"), kin = num(v, "kwin");
    pos(hp, "Enter output horsepower."); pos(kin, "Enter input kW.");
    return { outputs: [{ label: "Efficiency", value: ((hp * 0.7457) / kin) * 100, unit: "%" }, { label: "Losses", value: kin - hp * 0.7457, unit: "kW" }] };
  },
  "transformer-va": (v) => {
    const V = num(v, "V"), I = num(v, "I");
    pos(V, "Enter secondary voltage."); pos(I, "Enter total load current.");
    const va = V * I;
    const sizes = [20, 40, 50, 75, 100, 150];
    const next = sizes.find((s) => s >= va);
    return { outputs: [{ label: "Load", value: va, unit: "VA" }, { label: "Next common control transformer size", value: next ?? NaN, unit: "VA", text: next ? undefined : "Larger than 150 VA" }] };
  },
  "capacitor-mfd": (v) => {
    const I = num(v, "I"), V = num(v, "V"), f = num(v, "f") || 60;
    pos(I, "Enter measured capacitor current."); pos(V, "Enter measured voltage across the capacitor.");
    const uf = (I * 1e6) / (2 * Math.PI * f * V);
    return { outputs: [{ label: "Measured capacitance", value: uf, unit: "µF" }], notes: ["At 60 Hz this equals the field formula µF = 2652 × A ÷ V. Compare with the rated value and its tolerance (often ±5% or ±6%)."] };
  },
  "capacitive-reactance": (v) => {
    const f = num(v, "f"), c = num(v, "c");
    pos(f, "Enter frequency."); pos(c, "Enter capacitance.");
    return { outputs: [{ label: "Capacitive reactance", value: 1 / (2 * Math.PI * f * c), unit: "Ω" }] };
  },
  "series-parallel-resistance": (v) => {
    const list = String(v["values"] ?? "").split(/[\s,;]+/).filter(Boolean).map(Number);
    need(list.length >= 2 && list.every((x) => x > 0), "Enter two or more positive resistances separated by commas.");
    return { outputs: [{ label: "Series total", value: list.reduce((a, b) => a + b, 0), unit: "Ω" }, { label: "Parallel total", value: 1 / list.reduce((a, b) => a + 1 / b, 0), unit: "Ω" }] };
  },
  "power-factor": (v) => {
    const W = num(v, "W"), V = num(v, "V"), I = num(v, "I"), ph = String(v["phase"]);
    pos(W, "Enter real power."); pos(V, "Enter voltage."); pos(I, "Enter current.");
    const va = ph === "3" ? Math.sqrt(3) * V * I : V * I;
    const pf = W / va;
    need(pf <= 1.0001, "Real power can't exceed apparent power — recheck readings.");
    return { outputs: [{ label: "Power factor", value: pf, digits: 3 }, { label: "Apparent power", value: va, unit: "VA" }, { label: "Phase angle", value: (Math.acos(Math.min(1, pf)) * 180) / Math.PI, unit: "°" }] };
  },

  /* ---------------- Airflow ---------------- */
  "duct-velocity": (v) => {
    const cfm = num(v, "cfm"), shape = String(v["shape"]), a = num(v, "a"), b = num(v, "b");
    pos(cfm, "Enter airflow."); pos(a, "Enter duct size.");
    const areaFt2 = shape === "rect" ? (pos(b, "Enter duct height."), (a * b) / 144) : (Math.PI * a * a) / 4 / 144;
    const fpm = cfm / areaFt2;
    return { outputs: [{ label: "Velocity", value: fpm, unit: "ft/min" }, { label: "Velocity", value: fpm * 0.00508, unit: "m/s" }, { label: "Free area", value: areaFt2, unit: "ft²" }] };
  },
  "round-duct-size": (v) => {
    const cfm = num(v, "cfm"), fpm = num(v, "fpm");
    pos(cfm, "Enter airflow."); pos(fpm, "Enter target velocity.");
    const d = Math.sqrt(((cfm / fpm) * 144 * 4) / Math.PI);
    return { outputs: [{ label: "Diameter for target velocity", value: d, unit: "in" }, { label: "Diameter", value: d * 25.4, unit: "mm" }, { label: "Next standard round size", value: Math.ceil(d), unit: "in" }], notes: ["Velocity method only. Final sizing should also check friction rate and available static pressure (e.g. ACCA Manual D)."] };
  },
  "equivalent-duct-diameter": (v) => {
    const a = num(v, "a"), b = num(v, "b");
    pos(a, "Enter width."); pos(b, "Enter height.");
    const de = (1.3 * Math.pow(a * b, 0.625)) / Math.pow(a + b, 0.25);
    return { outputs: [{ label: "Equivalent round diameter (equal friction)", value: de, unit: "in" }, { label: "Aspect ratio", value: Math.max(a, b) / Math.min(a, b), digits: 3 }] };
  },
  "duct-friction-loss": (v) => {
    const cfm = num(v, "cfm"), d = num(v, "d"), L = num(v, "L");
    pos(cfm, "Enter airflow."); pos(d, "Enter diameter."); pos(L, "Enter length.");
    const per100 = (0.109136 * Math.pow(cfm, 1.9)) / Math.pow(d, 5.02);
    return { outputs: [{ label: "Friction rate", value: per100, unit: "inWC/100 ft" }, { label: "Friction loss for length", value: (per100 * L) / 100, unit: "inWC" }], notes: ["Approximation for standard air in clean galvanized round duct. Fittings add equivalent length."] };
  },
  "air-changes": (v) => {
    const cfm = num(v, "cfm"), vol = num(v, "volume");
    pos(cfm, "Enter airflow."); pos(vol, "Enter room volume.");
    return { outputs: [{ label: "Air changes per hour", value: (cfm * 60) / vol, unit: "ACH", digits: 3 }] };
  },
  "cfm-from-ach": (v) => {
    const ach = num(v, "ach"), vol = num(v, "volume");
    pos(ach, "Enter ACH."); pos(vol, "Enter volume.");
    const cfm = (ach * vol) / 60;
    return { outputs: [{ label: "Required airflow", value: cfm, unit: "CFM" }, { label: "Required airflow", value: cfm * 0.471947, unit: "L/s" }] };
  },
  "cfm-per-ton": (v) => {
    const cfm = num(v, "cfm"), tons = num(v, "tons");
    pos(cfm, "Enter airflow."); pos(tons, "Enter tons.");
    return { outputs: [{ label: "Airflow per ton", value: cfm / tons, unit: "CFM/ton" }, { label: "Airflow per kW", value: (cfm * 0.471947) / (tons * 3.5168528), unit: "L/s per kW" }] };
  },
  tesp: (v) => {
    const s = num(v, "supply"), r = num(v, "return"), rated = num(v, "rated");
    need(Number.isFinite(s) && Number.isFinite(r), "Enter both readings.");
    const t = Math.abs(s) + Math.abs(r);
    const out: CalcOutput[] = [{ label: "Total external static pressure", value: t, unit: "inWC" }, { label: "TESP", value: t * 249.08891, unit: "Pa" }];
    if (rated > 0) out.push({ label: "Percent of rated", value: (t / rated) * 100, unit: "%" });
    return { outputs: out };
  },
  "fan-affinity": (v) => {
    const r1 = num(v, "rpm1"), r2 = num(v, "rpm2"), q1 = num(v, "cfm1"), p1 = num(v, "sp1"), w1 = num(v, "bhp1");
    pos(r1, "Enter current speed."); pos(r2, "Enter new speed."); pos(q1, "Enter current airflow.");
    const k = r2 / r1;
    const out: CalcOutput[] = [{ label: "New airflow", value: q1 * k, unit: "CFM" }];
    if (p1 > 0) out.push({ label: "New static pressure", value: p1 * k * k, unit: "inWC" });
    if (w1 > 0) out.push({ label: "New power", value: w1 * k * k * k, unit: "bhp" });
    return { outputs: out };
  },
  "fan-power": (v) => {
    const cfm = num(v, "cfm"), sp = num(v, "sp"), eff = num(v, "eff") / 100;
    pos(cfm, "Enter airflow."); pos(sp, "Enter total pressure."); need(eff > 0 && eff <= 1, "Efficiency 1–100%.");
    const bhp = (cfm * sp) / (6356 * eff);
    return { outputs: [{ label: "Brake horsepower", value: bhp, unit: "bhp" }, { label: "Shaft power", value: bhp * 0.7457, unit: "kW" }, { label: "Air horsepower", value: (cfm * sp) / 6356, unit: "hp" }] };
  },
  "duct-surface-area": (v) => {
    const shape = String(v["shape"]), a = num(v, "a"), b = num(v, "b"), L = num(v, "L");
    pos(a, "Enter size."); pos(L, "Enter length.");
    const perimIn = shape === "rect" ? (pos(b, "Enter height."), 2 * (a + b)) : Math.PI * a;
    const ft2 = (perimIn / 12) * L;
    return { outputs: [{ label: "Surface area", value: ft2, unit: "ft²" }, { label: "Surface area", value: ft2 * 0.09290304, unit: "m²" }] };
  },

  /* ---------------- Building science ---------------- */
  "conduction-heat-loss": (v) => {
    const a = num(v, "area"), r = num(v, "r"), dt = num(v, "dt");
    pos(a, "Enter area."); pos(r, "Enter R-value."); need(Number.isFinite(dt), "Enter ΔT.");
    const q = (a * dt) / r;
    return { outputs: [{ label: "Heat loss", value: q, unit: "BTU/h" }, kw(q), { label: "U-factor", value: 1 / r, unit: "BTU/h·ft²·°F", digits: 3 }] };
  },
  "window-heat-loss": (v) => {
    const a = num(v, "area"), uf = num(v, "u"), dt = num(v, "dt");
    pos(a, "Enter area."); pos(uf, "Enter U-factor."); need(Number.isFinite(dt), "Enter ΔT.");
    const q = uf * a * dt;
    return { outputs: [{ label: "Heat loss", value: q, unit: "BTU/h" }, kw(q)] };
  },
  "building-heat-loss": (v) => {
    const dt = num(v, "dt");
    need(Number.isFinite(dt) && dt > 0, "Enter design ΔT.");
    const parts = [
      ["Walls", num(v, "wallA") / num(v, "wallR")],
      ["Ceiling", num(v, "ceilA") / num(v, "ceilR")],
      ["Floor", num(v, "floorA") / num(v, "floorR")],
      ["Windows & doors", num(v, "winA") * num(v, "winU")],
    ] as const;
    const out: CalcOutput[] = [];
    let total = 0;
    for (const [label, ua] of parts) {
      const q = Number.isFinite(ua) ? ua * dt : 0;
      total += q;
      out.push({ label, value: q, unit: "BTU/h" });
    }
    const inf = 0.018 * (num(v, "volume") || 0) * (num(v, "ach") || 0) * dt;
    total += inf;
    out.push({ label: "Infiltration", value: inf, unit: "BTU/h" }, { label: "Estimated total", value: total, unit: "BTU/h" }, kw(total));
    if (total <= 0) throw new CalcError("Enter at least one surface.");
    return { outputs: out, notes: ["Simplified conduction + infiltration estimate. Not a substitute for a room-by-room load calculation (CSA F280 / ACCA Manual J)."] };
  },
  "insulation-thickness": (v) => {
    const target = num(v, "target"), per = num(v, "perInch");
    pos(target, "Enter target R-value."); pos(per, "Enter R per inch.");
    const t = target / per;
    return { outputs: [{ label: "Thickness", value: t, unit: "in" }, { label: "Thickness", value: t * 25.4, unit: "mm" }] };
  },
  "insulation-quantity": (v) => {
    const a = num(v, "area"), cov = num(v, "coverage"), waste = num(v, "waste") || 0;
    pos(a, "Enter area."); pos(cov, "Enter coverage per bag/bundle from the label.");
    const need2 = a * (1 + waste / 100);
    return { outputs: [{ label: "Area incl. waste", value: need2, unit: "ft²" }, { label: "Bags / bundles", value: Math.ceil(need2 / cov), digits: 6 }] };
  },
  "blown-insulation": (v) => {
    const a = num(v, "area"), depth = num(v, "depth"), cov = num(v, "coverage");
    pos(a, "Enter area."); pos(depth, "Enter depth.");
    const ft3 = (a * depth) / 12;
    const out: CalcOutput[] = [{ label: "Installed volume", value: ft3, unit: "ft³" }, { label: "Installed volume", value: ft3 * 0.0283168, unit: "m³" }];
    if (cov > 0) out.push({ label: "Bags", value: Math.ceil(a / cov), digits: 6 });
    return { outputs: out, notes: ["Use the bag label's coverage for your target R-value — blown densities and settled depths vary by product."] };
  },
  "vapor-barrier-area": (v) => {
    const a = num(v, "area"), lap = num(v, "overlap") || 0, roll = num(v, "roll");
    pos(a, "Enter area.");
    const t = a * (1 + lap / 100);
    const out: CalcOutput[] = [{ label: "Sheet area needed", value: t, unit: "ft²" }];
    if (roll > 0) out.push({ label: "Rolls", value: Math.ceil(t / roll), digits: 6 });
    return { outputs: out };
  },
  "dew-point": (v) => {
    const t = num(v, "t"), rh = num(v, "rh");
    need(Number.isFinite(t), "Enter air temperature."); need(rh > 0 && rh <= 100, "RH must be 1–100%.");
    const dp = dewPointC(fToC(t), rh);
    return { outputs: [{ label: "Dew point", value: cToF(dp), unit: "°F" }, { label: "Dew point", value: dp, unit: "°C" }], notes: ["Magnus approximation (Sonntag constants); accurate to a fraction of a degree in normal HVAC ranges."] };
  },
  "relative-humidity": (v) => {
    const t = fToC(num(v, "t")), dp = fToC(num(v, "dp"));
    need(Number.isFinite(t) && Number.isFinite(dp), "Enter both temperatures."); need(dp <= t + 0.01, "Dew point can't exceed air temperature.");
    const a = 17.62, b = 243.12;
    const rh = 100 * Math.exp((a * dp) / (b + dp) - (a * t) / (b + t));
    return { outputs: [{ label: "Relative humidity", value: rh, unit: "%" }] };
  },
  "condensation-risk": (v) => {
    const t = num(v, "t"), rh = num(v, "rh"), s = num(v, "surface");
    need(Number.isFinite(t) && Number.isFinite(s), "Enter temperatures."); need(rh > 0 && rh <= 100, "RH must be 1–100%.");
    const dp = cToF(dewPointC(fToC(t), rh));
    const margin = s - dp;
    return { outputs: [{ label: "Dew point", value: dp, unit: "°F" }, { label: "Surface margin above dew point", value: margin, unit: "Δ°F" }, { label: "Risk", value: NaN, text: margin <= 0 ? "Condensation expected" : margin < 5 ? "High — within 5 °F" : "Low" }] };
  },
  "degree-day-energy": (v) => {
    const ua = num(v, "ua"), dd = num(v, "dd"), eff = num(v, "eff") / 100;
    pos(ua, "Enter UA (BTU/h·°F)."); pos(dd, "Enter heating degree-days (°F)."); need(eff > 0, "Enter efficiency or COP×100.");
    const btu = (ua * 24 * dd) / eff;
    return { outputs: [{ label: "Seasonal heating input", value: btu / 1e6, unit: "MMBTU" }, { label: "Equivalent", value: btu / 100000, unit: "therms" }, { label: "Equivalent", value: btu / 3412.14, unit: "kWh" }], notes: ["Degree-day estimates ignore internal and solar gains and balance-point shifts; treat as a rough seasonal figure."] };
  },

  /* ---------------- Combustion & heating ---------------- */
  "furnace-output": (v) => {
    const inp = num(v, "input"), eff = num(v, "eff");
    pos(inp, "Enter input BTU/h."); need(eff > 0 && eff <= 100, "Efficiency 1–100%.");
    const out = (inp * eff) / 100;
    return { outputs: [{ label: "Output", value: out, unit: "BTU/h" }, kw(out)], notes: ["AFUE is a seasonal rating; the rating plate's output/bonnet capacity is the authoritative figure."] };
  },
  "furnace-efficiency": (v) => {
    const out = num(v, "output"), inp = num(v, "input");
    pos(out, "Enter output."); pos(inp, "Enter input.");
    return { outputs: [{ label: "Efficiency", value: (out / inp) * 100, unit: "%" }, { label: "Losses", value: inp - out, unit: "BTU/h" }] };
  },
  "electric-furnace": (v) => {
    const k = num(v, "kw"), V = num(v, "V"), ph = String(v["phase"]);
    pos(k, "Enter kW."); pos(V, "Enter voltage.");
    const I = ph === "3" ? (k * 1000) / (Math.sqrt(3) * V) : (k * 1000) / V;
    return { outputs: [{ label: "Current", value: I, unit: "A" }, { label: "Heat output", value: k * 3412.14, unit: "BTU/h" }] };
  },
  "temperature-rise": (v) => {
    const s = num(v, "supply"), r = num(v, "return"), out = num(v, "output");
    need(Number.isFinite(s) && Number.isFinite(r), "Enter both temperatures.");
    const rise = s - r;
    const outs: CalcOutput[] = dF("Temperature rise", rise);
    if (out > 0 && rise > 0) outs.push({ label: "Estimated airflow", value: out / (1.08 * rise), unit: "CFM" });
    return { outputs: outs, notes: ["Compare with the rise range on the appliance rating plate."] };
  },
  "gas-consumption": (v) => {
    const inp = num(v, "input"), hours = num(v, "hours"), hv = num(v, "hv"), price = num(v, "price");
    pos(inp, "Enter input BTU/h."); pos(hours, "Enter run hours."); pos(hv, "Enter heating value.");
    const btu = inp * hours;
    const ft3 = btu / hv;
    return { outputs: [{ label: "Gas used", value: ft3, unit: "ft³" }, { label: "Gas used", value: ft3 * 0.0283168, unit: "m³" }, { label: "Energy", value: btu / 100000, unit: "therms" }, { label: "Cost", value: price > 0 ? ft3 * 0.0283168 * price : NaN, unit: "$" }], notes: ["Heating value varies by utility — use your supplier's figure. Price is per m³."] };
  },
  "gas-meter-clocking": (v) => {
    const size = num(v, "dial"), secs = num(v, "seconds"), hv = num(v, "hv") || 1000;
    pos(size, "Enter dial size."); pos(secs, "Enter seconds per revolution.");
    const cfh = (size * 3600) / secs;
    return { outputs: [{ label: "Gas flow", value: cfh, unit: "ft³/h" }, { label: "Input", value: cfh * hv, unit: "BTU/h" }] };
  },
  "combustion-air-volume": (v) => {
    const inp = num(v, "input"), vol = num(v, "volume");
    pos(inp, "Enter total appliance input."); pos(vol, "Enter room volume.");
    const req = (inp / 1000) * 50;
    return {
      outputs: [{ label: "Required volume (standard method)", value: req, unit: "ft³" }, { label: "Available volume", value: vol, unit: "ft³" }, { label: "Result", value: NaN, text: vol >= req ? "Meets the 50 ft³ per 1,000 BTU/h volume test" : "Below — outdoor combustion air openings likely required" }],
      notes: ["Educational check based on the NFPA 54 'standard method' for buildings of ordinary tightness. CSA B149.1 (Canada) uses different methods. Always follow the adopted code and manufacturer's instructions."],
    };
  },
  "boiler-efficiency": (v) => {
    const out = num(v, "output"), inp = num(v, "input");
    pos(out, "Enter output."); pos(inp, "Enter input.");
    return { outputs: [{ label: "Thermal efficiency (direct method)", value: (out / inp) * 100, unit: "%" }] };
  },

  /* ---------------- Piping & mechanical ---------------- */
  "pipe-volume": (v) => {
    const d = num(v, "id"), L = num(v, "L");
    pos(d, "Enter inside diameter."); pos(L, "Enter length.");
    const ft3 = ((Math.PI * (d / 12) ** 2) / 4) * L;
    return { outputs: [{ label: "Volume", value: ft3 * 7.48052, unit: "US gal" }, { label: "Volume", value: ft3 * 28.3168, unit: "L" }, { label: "Water weight", value: ft3 * 62.4, unit: "lb" }] };
  },
  "thermal-expansion": (v) => {
    const L = num(v, "L"), dt = num(v, "dt"), c = EXPANSION_PER_F[String(v["material"])];
    pos(L, "Enter length."); need(Number.isFinite(dt), "Enter ΔT."); need(c, "Choose a material.");
    const dl = L * 12 * c * dt;
    return { outputs: [{ label: "Length change", value: dl, unit: "in" }, { label: "Length change", value: dl * 25.4, unit: "mm" }], notes: ["Typical linear expansion coefficients; check the pipe manufacturer's data."] };
  },
  "hydronic-flow": (v) => {
    const q = num(v, "btuh"), dt = num(v, "dt");
    pos(q, "Enter heat load."); pos(dt, "Enter ΔT.");
    const gpm = q / (500 * dt);
    return { outputs: [{ label: "Flow", value: gpm, unit: "US gpm" }, { label: "Flow", value: gpm * 0.0630902, unit: "L/s" }], notes: ["500 constant is for water near 60 °F; glycol mixes need a correction factor."] };
  },
  "pump-head": (v) => {
    const psi = num(v, "psi"), sg = num(v, "sg") || 1;
    need(Number.isFinite(psi), "Enter pressure.");
    return { outputs: [{ label: "Head", value: (psi * 2.31) / sg, unit: "ft" }, { label: "Head", value: (psi * 2.31 * 0.3048) / sg, unit: "m" }] };
  },
  "pump-power": (v) => {
    const gpm = num(v, "gpm"), h = num(v, "head"), sg = num(v, "sg") || 1, eff = num(v, "eff") / 100;
    pos(gpm, "Enter flow."); pos(h, "Enter head."); need(eff > 0 && eff <= 1, "Efficiency 1–100%.");
    const bhp = (gpm * h * sg) / (3960 * eff);
    return { outputs: [{ label: "Brake horsepower", value: bhp, unit: "bhp" }, { label: "Shaft power", value: bhp * 0.7457, unit: "kW" }, { label: "Water horsepower", value: (gpm * h * sg) / 3960, unit: "hp" }] };
  },
  "heat-exchanger-effectiveness": (v) => {
    const hi = num(v, "hotIn"), ci = num(v, "coldIn"), co = num(v, "coldOut");
    need([hi, ci, co].every(Number.isFinite), "Enter temperatures."); need(hi > ci, "Hot inlet must be above cold inlet.");
    return { outputs: [{ label: "Effectiveness (cold side as Cmin)", value: ((co - ci) / (hi - ci)) * 100, unit: "%" }] };
  },
};
