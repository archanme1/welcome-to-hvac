import { convert } from "./units";
import { CalcError, has, need, num, type ComputeFn } from "./types";

/** Calculations available to everyone. Inputs arrive in each input's canonical unit. */
export const FREE_COMPUTE: Record<string, ComputeFn> = {
  "btu-to-kw": (v) => {
    const w = num(v, "power");
    need(Number.isFinite(w), "Enter a power value.");
    return {
      outputs: [
        { label: "BTU/h", value: convert(w, "power", "W", "BTUh"), unit: "BTU/h" },
        { label: "Kilowatts", value: w / 1000, unit: "kW" },
        { label: "Tons of refrigeration", value: convert(w, "power", "W", "ton"), unit: "tons" },
        { label: "Horsepower", value: convert(w, "power", "W", "hp"), unit: "hp" },
        { label: "Watts", value: w, unit: "W" },
      ],
    };
  },
  "cfm-converter": (v) => {
    const q = num(v, "flow");
    need(Number.isFinite(q), "Enter an airflow value.");
    return {
      outputs: [
        { label: "CFM", value: convert(q, "flow", "m3s", "cfm"), unit: "CFM" },
        { label: "Litres per second", value: q * 1000, unit: "L/s" },
        { label: "Cubic metres per hour", value: q * 3600, unit: "m³/h" },
      ],
    };
  },
  "r-value-rsi": (v) => {
    const rsi = num(v, "r");
    need(rsi > 0, "Enter an R-value greater than zero.");
    return {
      outputs: [
        { label: "R-value (imperial)", value: convert(rsi, "rvalue", "RSI", "R"), unit: "ft²·°F·h/BTU" },
        { label: "RSI (metric)", value: rsi, unit: "m²·K/W" },
        { label: "U-factor (metric)", value: 1 / rsi, unit: "W/m²·K" },
        { label: "U-factor (imperial)", value: convert(1 / rsi, "ufactor", "WmK2", "BTUft2F"), unit: "BTU/h·ft²·°F" },
      ],
    };
  },
  "ohms-law": (v) => {
    const known = ["V", "I", "R", "P"].filter((k) => has(v, k));
    need(known.length >= 2, "Enter any two values.");
    let V = has(v, "V") ? num(v, "V") : NaN;
    let I = has(v, "I") ? num(v, "I") : NaN;
    let R = has(v, "R") ? num(v, "R") : NaN;
    let P = has(v, "P") ? num(v, "P") : NaN;
    const k = known.slice(0, 2).join("");
    if (k === "VI") { R = V / I; P = V * I; }
    else if (k === "VR") { I = V / R; P = (V * V) / R; }
    else if (k === "VP") { I = P / V; R = (V * V) / P; }
    else if (k === "IR") { V = I * R; P = I * I * R; }
    else if (k === "IP") { V = P / I; R = P / (I * I); }
    else if (k === "RP") { V = Math.sqrt(P * R); I = Math.sqrt(P / R); }
    if (![V, I, R, P].every(Number.isFinite)) throw new CalcError("Values must be non-zero.");
    return {
      outputs: [
        { label: "Voltage", value: V, unit: "V" },
        { label: "Current", value: I, unit: "A" },
        { label: "Resistance", value: R, unit: "Ω" },
        { label: "Power", value: P, unit: "W" },
      ],
      notes: known.length > 2 ? ["More than two values entered — the first two (V, I, R, P order) were used."] : [],
    };
  },
};
