import { CALCULATORS, CATEGORIES } from "./registry";
import { CHECKLISTS, CHECKLIST_META } from "./checklists";
import type { CalculatorMeta } from "./types";

export const ALL_TOOLS: CalculatorMeta[] = [...CALCULATORS, ...CHECKLIST_META];
export const TOOL_BY_SLUG: Record<string, CalculatorMeta> = Object.fromEntries(ALL_TOOLS.map((t) => [t.slug, t]));
export const CHECKLIST_BY_SLUG = Object.fromEntries(CHECKLISTS.map((c) => [c.slug, c]));
export { CATEGORIES };
export const isIndexable = (t: CalculatorMeta) => t.kind !== "pending";
