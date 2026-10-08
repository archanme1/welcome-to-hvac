import type { CalculatorMeta } from "./types";

export type Checklist = { slug: string; items: { section: string; items: string[] }[] };

const L = (slug: string, sections: [string, string[]][]): Checklist => ({ slug, items: sections.map(([section, items]) => ({ section, items })) });

export const CHECKLISTS: Checklist[] = [
  L("ppe-checklist", [
    ["Before work", ["Safety glasses or goggles rated for the task", "Work gloves; cut-resistant where sheet metal is handled", "Safety footwear", "Hearing protection near running equipment"]],
    ["Task-specific", ["Refrigerant-rated gloves and face shield when handling refrigerant", "Arc-rated clothing and voltage-rated gloves where electrical work requires it", "Respirator for insulation, mould or dust exposure", "Hard hat on construction sites"]],
    ["Check", ["PPE inspected for damage", "Fits correctly", "Replaced if contaminated or expired"]],
  ]),
  L("lockout-tagout-checklist", [
    ["Prepare", ["Identify all energy sources (electrical, gas, stored pressure, mechanical)", "Notify affected people", "Review the employer's written LOTO procedure"]],
    ["Isolate", ["Shut down equipment normally", "Open disconnects / close valves", "Apply personal lock and tag to every isolation point", "Release stored energy (capacitors, pressure, springs)"]],
    ["Verify", ["Test the meter on a known live source", "Verify absence of voltage", "Re-test the meter", "Attempt start — confirm no operation"]],
    ["Restore", ["Tools and guards back in place", "People clear", "Remove own lock only", "Notify affected people"]],
  ]),
  L("electrical-safety-checklist", [
    ["Before", ["Meter rated (CAT rating) for the circuit", "Leads and probes undamaged", "Correct PPE for the hazard", "Work de-energized wherever possible"]],
    ["During", ["One-hand rule where practical", "No jewellery", "Dry hands and footing", "Capacitors discharged before handling"]],
    ["After", ["Covers reinstalled", "Connections torqued per manufacturer", "Grounding verified"]],
  ]),
  L("working-at-heights-checklist", [
    ["Planning", ["Fall protection training current (as required in your province/state)", "Rescue plan in place", "Anchor points identified"]],
    ["Equipment", ["Harness and lanyard inspected", "Ladder rated, undamaged, set at 4:1 and secured", "Roof edge protection or warning lines"]],
    ["Conditions", ["Weather and wind acceptable", "Roof surface dry / clear of ice", "Tools tethered"]],
  ]),
  L("hvac-maintenance-checklist", [
    ["Airside", ["Replace or clean filter", "Inspect blower wheel and motor", "Check belt tension and condition", "Measure total external static pressure"]],
    ["Electrical", ["Tighten connections (de-energized)", "Inspect contactor", "Test capacitors", "Record voltage and amperage"]],
    ["Drainage", ["Clear condensate drain and trap", "Test float/overflow switch"]],
    ["Records", ["Log readings", "Note recommendations for customer"]],
  ]),
  L("hvac-commissioning-checklist", [
    ["Pre-start", ["Installation matches drawings and manufacturer instructions", "Electrical supply matches nameplate", "Condensate and venting complete", "Duct system sealed and connected"]],
    ["Start-up", ["Verify airflow (static, temperature rise or measured CFM)", "Verify refrigerant charge per manufacturer method", "Verify safeties and controls operate", "Thermostat configured"]],
    ["Hand-over", ["Readings recorded", "Customer shown operation and filter change", "Documentation and warranty registration"]],
  ]),
  L("heat-pump-commissioning-checklist", [
    ["Setup", ["Outdoor unit level, clearances and snow height per manufacturer", "Line set evacuated and vacuum decay test passed", "Breaker and conductor sizes match MCA/MOCP"]],
    ["Operation", ["Cooling and heating modes verified", "Reversing valve switches", "Defrost operation verified or simulated per manufacturer", "Auxiliary/backup heat staging and lockout configured"]],
    ["Records", ["Superheat/subcooling per manufacturer", "Supply/return temperatures in both modes", "Thermostat balance point settings documented"]],
  ]),
  L("ac-maintenance-checklist", [
    ["Outdoor", ["Clean condenser coil", "Clear debris and vegetation", "Inspect fan blade and motor", "Check capacitor and contactor"]],
    ["Indoor", ["Inspect evaporator coil", "Clear drain", "Filter replaced"]],
    ["Performance", ["Record suction and liquid pressures", "Calculate superheat / subcooling", "Measure supply/return ΔT"]],
  ]),
  L("furnace-service-checklist", [
    ["Safety", ["CO alarm present and tested", "Venting intact, sloped and secured", "Combustion air adequate"]],
    ["Burner & ignition", ["Inspect burners and flame", "Clean flame sensor", "Check igniter", "Verify gas pressure per manufacturer"]],
    ["Operation", ["Measure temperature rise", "Test limit and rollout switches (no bypassing)", "Inspect heat exchanger visually", "Combustion analysis where equipped and trained"]],
  ]),
  L("refrigerant-handling-checklist", [
    ["Certification", ["Holds required certification (e.g. ODS/ halocarbon certificate in Canada, EPA 608 in the US)"]],
    ["Recovery", ["Recovery cylinder rated, in date and below 80% fill", "Cylinder weighed and labelled", "Hoses with low-loss fittings"]],
    ["Safety", ["Gloves and eye protection", "Ventilation adequate", "A2L refrigerant procedures followed where applicable", "Records of quantities kept"]],
  ]),
  L("equipment-inspection-checklist", [
    ["General", ["Nameplate data recorded", "Clearances maintained", "Mounting secure", "No unusual noise or vibration"]],
    ["Condition", ["Corrosion", "Oil stains (possible leaks)", "Insulation condition", "Wiring condition"]],
  ]),
  L("technician-measurement-log", [
    ["Electrical", ["Supply voltage L1–L2 ____ V", "Compressor amps ____ A", "Fan motor amps ____ A", "Capacitor µF ____ (rated ____)"]],
    ["Airside", ["Return temperature ____", "Supply temperature ____", "Supply static ____ inWC", "Return static ____ inWC"]],
    ["Refrigerant", ["Suction pressure ____ / sat ____", "Liquid pressure ____ / sat ____", "Superheat ____", "Subcooling ____"]],
  ]),
];

const TITLES: Record<string, [string, string]> = {
  "ppe-checklist": ["HVAC PPE Checklist", "Personal protective equipment checklist for HVAC technicians."],
  "lockout-tagout-checklist": ["Lockout/Tagout (LOTO) Checklist", "Step-by-step energy isolation checklist for HVAC equipment."],
  "electrical-safety-checklist": ["Electrical Safety Checklist", "Electrical safety checks before, during and after HVAC electrical work."],
  "working-at-heights-checklist": ["Working at Heights Checklist", "Fall protection and ladder checks for rooftop and attic HVAC work."],
  "hvac-maintenance-checklist": ["HVAC Maintenance Checklist", "Seasonal HVAC preventive maintenance checklist."],
  "hvac-commissioning-checklist": ["HVAC Commissioning Checklist", "Start-up and commissioning checklist for new HVAC systems."],
  "heat-pump-commissioning-checklist": ["Heat Pump Commissioning Checklist", "Heat pump start-up checklist including defrost and backup heat."],
  "ac-maintenance-checklist": ["Air Conditioner Maintenance Checklist", "AC tune-up checklist for outdoor and indoor sections."],
  "furnace-service-checklist": ["Furnace Service Checklist", "Gas furnace service and safety checklist."],
  "refrigerant-handling-checklist": ["Refrigerant Handling Checklist", "Safe refrigerant recovery and handling checklist."],
  "equipment-inspection-checklist": ["Equipment Inspection Checklist", "General HVAC equipment inspection checklist."],
  "technician-measurement-log": ["Technician Measurement Log", "Printable HVAC service measurement log."],
};

export const CHECKLIST_META: CalculatorMeta[] = CHECKLISTS.map((c) => {
  const [title, description] = TITLES[c.slug]!;
  return {
    slug: c.slug, title, short: title.replace(" Checklist", ""), category: "safety", tier: "free", kind: "checklist",
    description: `${description} Printable and free.`,
    intro: `${description} Tick items as you go, then print or save as PDF.`,
    assumptions: ["Educational checklist. It does not replace legally required procedures, your employer's programs, applicable standards, manufacturer instructions or certified inspections."],
  };
});
