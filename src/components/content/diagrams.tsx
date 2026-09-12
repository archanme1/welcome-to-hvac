import { AppLink } from "@/components/app-link";

/**
 * Lightweight inline SVG diagrams. Each node can link to the topic that
 * explains it, so a diagram doubles as navigation.
 */

type NodeSpec = { label: string; href?: string; tone?: "hot" | "cold" | "electric" | "neutral" };

const TONE_FILL: Record<string, string> = {
  hot: "fill-diagram-hot/15 stroke-diagram-hot",
  cold: "fill-diagram-cold/15 stroke-diagram-cold",
  electric: "fill-diagram-electric/15 stroke-diagram-electric",
  neutral: "fill-diagram-fill stroke-diagram-line",
};

function FlowDiagram({
  title,
  nodes,
  note,
}: {
  title: string;
  nodes: NodeSpec[];
  note?: string;
}) {
  return (
    <figure className="mt-6">
      <div className="overflow-x-auto rounded-lg border bg-card p-4">
        <div className="flex min-w-max items-stretch gap-2">
          {nodes.map((node, i) => (
            <div key={node.label} className="flex items-center gap-2">
              <DiagramNode node={node} />
              {i < nodes.length - 1 ? (
                <span aria-hidden className="text-muted-foreground">
                  &rarr;
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      <figcaption className="mt-2 text-xs text-muted-foreground">
        {title}
        {note ? ` — ${note}` : ""}
      </figcaption>
    </figure>
  );
}

function DiagramNode({ node }: { node: NodeSpec }) {
  const tone = node.tone ?? "neutral";
  const base =
    "grid h-16 w-32 place-items-center rounded-md border-2 px-2 text-center text-xs font-medium leading-tight transition-colors";
  const toneClass =
    tone === "hot"
      ? "border-diagram-hot bg-diagram-hot/10"
      : tone === "cold"
        ? "border-diagram-cold bg-diagram-cold/10"
        : tone === "electric"
          ? "border-diagram-electric bg-diagram-electric/10"
          : "border-border bg-muted/40";

  if (node.href) {
    return (
      <AppLink to={node.href} className={`${base} ${toneClass} hover:bg-accent`}>
        {node.label}
      </AppLink>
    );
  }
  return <div className={`${base} ${toneClass}`}>{node.label}</div>;
}

const DIAGRAMS: Record<string, () => React.ReactElement> = {
  "refrigeration-cycle": () => (
    <FlowDiagram
      title="Vapor compression refrigeration cycle"
      note="heat is absorbed in the evaporator and rejected at the condenser"
      nodes={[
        { label: "Compressor", href: "/components/compressor", tone: "hot" },
        { label: "Condenser", href: "/components/condenser", tone: "hot" },
        { label: "Metering Device", href: "/components/txv", tone: "cold" },
        { label: "Evaporator", href: "/components/evaporator", tone: "cold" },
      ]}
    />
  ),
  "gas-furnace-sequence": () => (
    <FlowDiagram
      title="Gas furnace sequence of operation"
      note="each step must prove before the next one is allowed"
      nodes={[
        { label: "Thermostat Call", href: "/components/thermostat", tone: "electric" },
        { label: "Control Board", href: "/components/control-board", tone: "electric" },
        { label: "Inducer", href: "/components/inducer-motor" },
        { label: "Pressure Switch", href: "/components/pressure-switch" },
        { label: "Ignitor", href: "/components/hot-surface-ignitor", tone: "hot" },
        { label: "Gas Valve", href: "/components/gas-valve", tone: "hot" },
        { label: "Flame Sensor", href: "/components/flame-sensor", tone: "hot" },
        { label: "Blower", href: "/components/blower-motor" },
      ]}
    />
  ),
  "heat-pump-cycle": () => (
    <FlowDiagram
      title="Heat pump refrigerant flow"
      note="the reversing valve changes which coil evaporates and which condenses"
      nodes={[
        { label: "Compressor", href: "/components/compressor", tone: "hot" },
        { label: "Reversing Valve", href: "/components/reversing-valve" },
        { label: "Outdoor Coil", tone: "cold" },
        { label: "Metering Device", href: "/components/txv" },
        { label: "Indoor Coil", tone: "hot" },
      ]}
    />
  ),
  "24v-control-circuit": () => (
    <FlowDiagram
      title="24V control circuit concept"
      note="educational concept only — always follow the equipment wiring diagram"
      nodes={[
        { label: "Transformer 24V", href: "/components/transformer", tone: "electric" },
        { label: "R terminal", tone: "electric" },
        { label: "Thermostat", href: "/components/thermostat", tone: "electric" },
        { label: "Y / W / G", tone: "electric" },
        { label: "Contactor / Relay", href: "/components/contactor", tone: "electric" },
        { label: "C common", tone: "electric" },
      ]}
    />
  ),
  "air-distribution": () => (
    <FlowDiagram
      title="Air distribution path"
      nodes={[
        { label: "Return Grille" },
        { label: "Filter" },
        { label: "Blower", href: "/components/blower-motor" },
        { label: "Coil / Heat Exchanger" },
        { label: "Supply Duct" },
        { label: "Registers" },
      ]}
    />
  ),
  "venting-system": () => (
    <FlowDiagram
      title="Combustion and venting path"
      note="venting materials, sizing and terminations are governed by local code and the manufacturer"
      nodes={[
        { label: "Combustion Air", tone: "cold" },
        { label: "Burner", tone: "hot" },
        { label: "Heat Exchanger", tone: "hot" },
        { label: "Inducer", href: "/components/inducer-motor" },
        { label: "Vent Pipe", tone: "hot" },
        { label: "Termination" },
      ]}
    />
  ),
  "hydronic-loop": () => (
    <FlowDiagram
      title="Hydronic heating loop"
      nodes={[
        { label: "Boiler", href: "/equipment/gas-boiler", tone: "hot" },
        { label: "Circulator", href: "/components/circulator" },
        { label: "Zone Valve", href: "/components/zone-valve" },
        { label: "Emitter" },
        { label: "Return", tone: "cold" },
        { label: "Expansion Tank", href: "/components/expansion-tank" },
      ]}
    />
  ),
  "hrv-airflow": () => (
    <FlowDiagram
      title="HRV / ERV airflow"
      note="two separate air streams exchange heat without mixing"
      nodes={[
        { label: "Outdoor Air", tone: "cold" },
        { label: "Core", href: "/components/hrv-core" },
        { label: "Supply to House", tone: "hot" },
        { label: "Stale Air Return", tone: "hot" },
        { label: "Exhaust Outdoors", tone: "cold" },
      ]}
    />
  ),
  "capacitor-terminals": () => (
    <FlowDiagram
      title="Dual run capacitor terminals"
      note="HERM serves the compressor, FAN serves the condenser fan, C is common"
      nodes={[
        { label: "HERM", tone: "electric" },
        { label: "C (common)", tone: "electric" },
        { label: "FAN", tone: "electric" },
      ]}
    />
  ),
  "basic-hvac-system": () => (
    <FlowDiagram
      title="A basic HVAC system"
      nodes={[
        { label: "Thermostat", href: "/components/thermostat", tone: "electric" },
        { label: "Heating Source", tone: "hot" },
        { label: "Cooling Source", tone: "cold" },
        { label: "Air Handler", href: "/equipment/air-handler" },
        { label: "Duct System" },
        { label: "Conditioned Space" },
      ]}
    />
  ),
};

export function Diagram({ diagramKey, caption }: { diagramKey: string; caption?: string }) {
  const render = DIAGRAMS[diagramKey];
  if (!render) return null;
  return (
    <div>
      {render()}
      {caption ? <p className="mt-1 text-xs text-muted-foreground">{caption}</p> : null}
    </div>
  );
}

export function hasDiagram(key: string | null | undefined) {
  return !!key && key in DIAGRAMS;
}
