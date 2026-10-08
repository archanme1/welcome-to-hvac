/** Unit definitions. Each unit's factor converts to the dimension's SI base unit. */
export type Unit = { id: string; label: string; factor: number };
export type Dimension = { id: string; label: string; base: string; units: Unit[] };

const u = (id: string, label: string, factor: number): Unit => ({ id, label, factor });

export const DIMENSIONS: Dimension[] = [
  { id: "temperature", label: "Temperature", base: "C", units: [u("C", "°C", 1), u("F", "°F", 1), u("K", "K", 1), u("R", "°R", 1)] },
  { id: "tempDiff", label: "Temperature difference", base: "K", units: [u("K", "K / Δ°C", 1), u("dF", "Δ°F", 5 / 9)] },
  { id: "pressure", label: "Pressure", base: "Pa", units: [
    u("Pa", "Pa", 1), u("kPa", "kPa", 1000), u("MPa", "MPa", 1e6), u("bar", "bar", 1e5), u("mbar", "mbar", 100),
    u("psi", "psi", 6894.757293168), u("inWC", "inWC (in H₂O)", 249.08891), u("mmWC", "mm H₂O", 9.80665),
    u("inHg", "inHg", 3386.389), u("mmHg", "mmHg", 133.322387415), u("torr", "torr", 133.322368),
    u("micron", "micron (µmHg)", 0.133322387415), u("atm", "atm", 101325),
  ] },
  { id: "flow", label: "Volumetric flow", base: "m3s", units: [
    u("cfm", "CFM (ft³/min)", 0.00047194745), u("Ls", "L/s", 0.001), u("m3h", "m³/h", 1 / 3600),
    u("m3s", "m³/s", 1), u("Lmin", "L/min", 1 / 60000), u("gpm", "US gpm", 6.30901964e-5), u("igpm", "Imp gpm", 7.57681667e-5),
  ] },
  { id: "power", label: "Power / heat rate", base: "W", units: [
    u("W", "W", 1), u("kW", "kW", 1000), u("MW", "MW", 1e6), u("BTUh", "BTU/h", 0.29307107), u("MBH", "MBH (1,000 BTU/h)", 293.07107),
    u("ton", "Ton of refrigeration", 3516.8528), u("hp", "hp (mechanical)", 745.69987), u("hpM", "hp (metric)", 735.49875),
  ] },
  { id: "energy", label: "Energy", base: "J", units: [
    u("J", "J", 1), u("kJ", "kJ", 1000), u("MJ", "MJ", 1e6), u("GJ", "GJ", 1e9), u("Wh", "Wh", 3600), u("kWh", "kWh", 3.6e6),
    u("BTU", "BTU", 1055.05585), u("therm", "therm", 105505585), u("cal", "cal", 4.184), u("kcal", "kcal", 4184), u("ftlbf", "ft·lbf", 1.3558179483),
  ] },
  { id: "force", label: "Force", base: "N", units: [u("N", "N", 1), u("kN", "kN", 1000), u("lbf", "lbf", 4.4482216152605), u("kgf", "kgf", 9.80665)] },
  { id: "torque", label: "Torque", base: "Nm", units: [u("Nm", "N·m", 1), u("ftlb", "ft·lb", 1.3558179483), u("inlb", "in·lb", 0.112984829), u("kgfm", "kgf·m", 9.80665)] },
  { id: "density", label: "Density", base: "kgm3", units: [u("kgm3", "kg/m³", 1), u("gcm3", "g/cm³", 1000), u("lbft3", "lb/ft³", 16.01846337), u("lbgal", "lb/US gal", 119.8264273)] },
  { id: "velocity", label: "Velocity", base: "ms", units: [u("ms", "m/s", 1), u("kmh", "km/h", 1 / 3.6), u("fpm", "ft/min (FPM)", 0.00508), u("fps", "ft/s", 0.3048), u("mph", "mph", 0.44704)] },
  { id: "length", label: "Length", base: "m", units: [
    u("mm", "mm", 0.001), u("cm", "cm", 0.01), u("m", "m", 1), u("km", "km", 1000), u("in", "in", 0.0254), u("ft", "ft", 0.3048), u("yd", "yd", 0.9144), u("mi", "mi", 1609.344),
  ] },
  { id: "area", label: "Area", base: "m2", units: [
    u("mm2", "mm²", 1e-6), u("cm2", "cm²", 1e-4), u("m2", "m²", 1), u("in2", "in²", 6.4516e-4), u("ft2", "ft²", 0.09290304), u("yd2", "yd²", 0.83612736), u("acre", "acre", 4046.8564224),
  ] },
  { id: "volume", label: "Volume", base: "m3", units: [
    u("mL", "mL", 1e-6), u("L", "L", 0.001), u("m3", "m³", 1), u("in3", "in³", 1.6387064e-5), u("ft3", "ft³", 0.028316846592),
    u("yd3", "yd³", 0.764554857984), u("gal", "US gal", 0.003785411784), u("igal", "Imp gal", 0.00454609),
  ] },
  { id: "mass", label: "Mass / weight", base: "kg", units: [u("g", "g", 0.001), u("kg", "kg", 1), u("t", "tonne", 1000), u("oz", "oz", 0.028349523125), u("lb", "lb", 0.45359237), u("ston", "short ton", 907.18474)] },
  { id: "voltage", label: "Voltage", base: "V", units: [u("mV", "mV", 0.001), u("V", "V", 1), u("kV", "kV", 1000)] },
  { id: "current", label: "Current", base: "A", units: [u("mA", "mA", 0.001), u("A", "A", 1), u("kA", "kA", 1000)] },
  { id: "resistance", label: "Resistance", base: "ohm", units: [u("ohm", "Ω", 1), u("kohm", "kΩ", 1000), u("Mohm", "MΩ", 1e6)] },
  { id: "capacitance", label: "Capacitance", base: "F", units: [u("pF", "pF", 1e-12), u("nF", "nF", 1e-9), u("uF", "µF (MFD)", 1e-6), u("F", "F", 1)] },
  { id: "rvalue", label: "Thermal resistance (R-value)", base: "RSI", units: [u("RSI", "RSI (m²·K/W)", 1), u("R", "R (ft²·°F·h/BTU)", 0.1761101838)] },
  { id: "ufactor", label: "U-factor", base: "WmK2", units: [u("WmK2", "W/m²·K", 1), u("BTUft2F", "BTU/h·ft²·°F", 5.678263341)] },
  { id: "conductivity", label: "Thermal conductivity", base: "WmK", units: [u("WmK", "W/m·K", 1), u("BTUin", "BTU·in/h·ft²·°F", 0.144227888), u("BTUft", "BTU/h·ft·°F", 1.730734666)] },
  { id: "specificHeat", label: "Specific heat", base: "JkgK", units: [u("JkgK", "J/kg·K", 1), u("kJkgK", "kJ/kg·K", 1000), u("BTUlbF", "BTU/lb·°F", 4186.8)] },
];

export const DIM_BY_ID: Record<string, Dimension> = Object.fromEntries(DIMENSIONS.map((d) => [d.id, d]));

function toCelsius(v: number, from: string) {
  if (from === "F") return ((v - 32) * 5) / 9;
  if (from === "K") return v - 273.15;
  if (from === "R") return ((v - 491.67) * 5) / 9;
  return v;
}
function fromCelsius(c: number, to: string) {
  if (to === "F") return (c * 9) / 5 + 32;
  if (to === "K") return c + 273.15;
  if (to === "R") return ((c + 273.15) * 9) / 5;
  return c;
}

/** Convert a value between two units of the same dimension. */
export function convert(value: number, dim: string, from: string, to: string): number {
  if (from === to) return value;
  if (dim === "temperature") return fromCelsius(toCelsius(value, from), to);
  const d = DIM_BY_ID[dim];
  if (!d) throw new Error(`Unknown dimension ${dim}`);
  const f = d.units.find((x) => x.id === from);
  const t = d.units.find((x) => x.id === to);
  if (!f || !t) throw new Error(`Unknown unit in ${dim}`);
  return (value * f.factor) / t.factor;
}

export function unitLabel(dim: string, id: string): string {
  return DIM_BY_ID[dim]?.units.find((x) => x.id === id)?.label ?? id;
}

/** Round sensibly for display: significant figures for small/large numbers. */
export function formatNumber(v: number, digits = 4): string {
  if (!Number.isFinite(v)) return "—";
  if (v === 0) return "0";
  const abs = Math.abs(v);
  if (abs >= 1e9 || abs < 1e-4) return v.toExponential(digits - 1);
  const decimals = Math.max(0, digits - 1 - Math.floor(Math.log10(abs)));
  return Number(v.toFixed(Math.min(decimals, 8))).toLocaleString("en-US", { maximumFractionDigits: Math.min(decimals, 8) });
}
