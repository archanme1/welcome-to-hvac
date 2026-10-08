export type CalcCategory =
  | "general"
  | "fundamentals"
  | "refrigeration"
  | "electrical"
  | "airflow"
  | "building"
  | "combustion"
  | "piping"
  | "safety";

export type CalcInput = {
  key: string;
  label: string;
  /** Dimension id from units.ts; the user can pick any unit in it. */
  dim?: string;
  /** Unit the formula expects (canonical). Required when dim is set. */
  unit?: string;
  /** Unit choices offered (defaults to all units in the dimension). */
  units?: string[];
  /** Plain unit label for dimensionless/custom inputs, e.g. "%". */
  suffix?: string;
  default?: number | string;
  options?: { value: string; label: string }[];
  type?: "number" | "select" | "text";
  optional?: boolean;
  min?: number;
  max?: number;
  help?: string;
};

export type CalcOutput = { label: string; value: number; unit?: string | undefined; digits?: number | undefined; text?: string | undefined };
export type CalcResult = { outputs: CalcOutput[]; notes?: string[] };
export type CalcValues = Record<string, number | string>;
export type ComputeFn = (v: CalcValues) => CalcResult;

export type CalculatorMeta = {
  slug: string;
  title: string;
  /** Short H1-friendly name used in cards. */
  short: string;
  category: CalcCategory;
  tier: "free" | "pro";
  kind: "calc" | "converter" | "checklist" | "pending";
  description: string;
  intro: string;
  formula?: string[];
  variables?: [string, string][];
  example?: string;
  application?: string;
  mistakes?: string[];
  assumptions?: string[];
  related?: string[];
  lessons?: { label: string; q: string }[];
  inputs?: CalcInput[];
  keywords?: string[];
  /** For "pending" tools: the reference data still needed. */
  dataNeeded?: string;
};

export class CalcError extends Error {}
export function need(cond: unknown, message: string): asserts cond {
  if (!cond) throw new CalcError(message);
}
export const num = (v: CalcValues, k: string) => {
  const x = typeof v[k] === "number" ? (v[k] as number) : Number(v[k]);
  return x;
};
export const has = (v: CalcValues, k: string) => v[k] !== undefined && v[k] !== "" && Number.isFinite(num(v, k));
