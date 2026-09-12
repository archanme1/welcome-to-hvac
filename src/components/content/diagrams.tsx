import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { AppLink } from "@/components/app-link";
import { Button } from "@/components/ui/button";

/**
 * Lightweight inline SVG-free diagrams built from semantic tokens. Each node can
 * link to the topic that explains it, so a diagram doubles as navigation.
 * Sequence diagrams can be stepped through or played as a simple animation.
 */

type NodeSpec = {
  label: string;
  href?: string;
  tone?: "hot" | "cold" | "electric" | "neutral";
  /** Shown while this node is the active step of an animated walkthrough. */
  step?: string;
};

function FlowDiagram({
  title,
  nodes,
  note,
  animated,
  loop,
}: {
  title: string;
  nodes: NodeSpec[];
  note?: string;
  /** Adds play / step controls that walk the nodes in order. */
  animated?: boolean;
  /** Restart at the first node after the last one (cycles). */
  loop?: boolean;
}) {
  const [active, setActive] = useState(animated ? 0 : -1);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const id = setTimeout(() => {
      setActive((i) => {
        if (i >= nodes.length - 1) {
          if (loop) return 0;
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, 1600);
    return () => clearTimeout(id);
  }, [playing, active, nodes.length, loop]);

  const activeNode = active >= 0 ? nodes[active] : undefined;

  return (
    <figure className="mt-6">
      <div className="rounded-lg border bg-card p-4">
        <div className="overflow-x-auto">
          <div className="flex min-w-max items-stretch gap-2">
            {nodes.map((node, i) => (
              <div key={node.label} className="flex items-center gap-2">
                <DiagramNode
                  node={node}
                  active={i === active}
                  dimmed={animated ? i !== active : false}
                  onFocusStep={animated ? () => setActive(i) : undefined}
                />
                {i < nodes.length - 1 ? (
                  <span aria-hidden className="text-muted-foreground">
                    &rarr;
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {animated ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                if (!playing && active >= nodes.length - 1) setActive(0);
                setPlaying((p) => !p);
              }}
            >
              {playing ? <Pause className="mr-1.5 h-3.5 w-3.5" /> : <Play className="mr-1.5 h-3.5 w-3.5" />}
              {playing ? "Pause" : "Play"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setPlaying(false);
                setActive((i) => Math.max(0, i - 1));
              }}
            >
              Previous
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setPlaying(false);
                setActive((i) => Math.min(nodes.length - 1, i + 1));
              }}
            >
              Next
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setPlaying(false);
                setActive(0);
              }}
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Restart
            </Button>
            <span className="ml-auto text-xs text-muted-foreground">
              Step {Math.max(1, active + 1)} of {nodes.length}
            </span>
          </div>
        ) : null}

        {animated && activeNode ? (
          <p aria-live="polite" className="mt-3 text-sm leading-6">
            <span className="font-semibold">{activeNode.label}:</span>{" "}
            {activeNode.step ?? "Part of the sequence."}
          </p>
        ) : null}
      </div>
      <figcaption className="mt-2 text-xs text-muted-foreground">
        {title}
        {note ? ` — ${note}` : ""}
      </figcaption>
    </figure>
  );
}

function DiagramNode({
  node,
  active,
  dimmed,
  onFocusStep,
}: {
  node: NodeSpec;
  active?: boolean;
  dimmed?: boolean;
  onFocusStep?: (() => void) | undefined;
}) {
  const tone = node.tone ?? "neutral";
  const base =
    "grid h-16 w-32 place-items-center rounded-md border-2 px-2 text-center text-xs font-medium leading-tight transition-all duration-300";
  const toneClass =
    tone === "hot"
      ? "border-diagram-hot bg-diagram-hot/10"
      : tone === "cold"
        ? "border-diagram-cold bg-diagram-cold/10"
        : tone === "electric"
          ? "border-diagram-electric bg-diagram-electric/10"
          : "border-border bg-muted/40";
  const stateClass = active
    ? "scale-[1.04] shadow-md ring-2 ring-ring"
    : dimmed
      ? "opacity-55"
      : "";
  const className = `${base} ${toneClass} ${stateClass}`;

  if (node.href) {
    return (
      <AppLink
        to={node.href}
        className={`${className} hover:bg-accent`}
        onMouseEnter={onFocusStep}
      >
        {node.label}
      </AppLink>
    );
  }
  if (onFocusStep) {
    return (
      <button type="button" onClick={onFocusStep} className={className}>
        {node.label}
      </button>
    );
  }
  return <div className={className}>{node.label}</div>;
}

/** Heat pump walkthrough with a heating / cooling mode switch. */
function HeatPumpDiagram() {
  const [mode, setMode] = useState<"heating" | "cooling">("heating");
  const heating = mode === "heating";

  return (
    <div>
      <div className="mt-6 flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={heating ? "default" : "outline"}
          onClick={() => setMode("heating")}
        >
          Heating mode
        </Button>
        <Button
          type="button"
          size="sm"
          variant={heating ? "outline" : "default"}
          onClick={() => setMode("cooling")}
        >
          Cooling mode
        </Button>
      </div>
      <FlowDiagram
        key={mode}
        animated
        loop
        title={`Heat pump refrigerant flow — ${mode}`}
        note="the reversing valve decides which coil evaporates and which condenses"
        nodes={[
          {
            label: "Compressor",
            href: "/components/compressor",
            tone: "hot",
            step: "The compressor raises refrigerant pressure and temperature, so hot discharge gas leaves it in either mode.",
          },
          {
            label: "Reversing Valve",
            href: "/components/reversing-valve",
            tone: heating ? "hot" : "cold",
            step: heating
              ? "In heating the valve sends discharge gas to the indoor coil."
              : "In cooling the valve sends discharge gas to the outdoor coil.",
          },
          {
            label: heating ? "Indoor Coil (condenser)" : "Outdoor Coil (condenser)",
            tone: "hot",
            step: heating
              ? "Indoors the refrigerant rejects heat into the house air and condenses to liquid."
              : "Outdoors the refrigerant rejects heat to outdoor air and condenses to liquid.",
          },
          {
            label: "Metering Device",
            href: "/components/txv",
            tone: "neutral",
            step: "The metering device drops pressure so the liquid can boil at a low temperature.",
          },
          {
            label: heating ? "Outdoor Coil (evaporator)" : "Indoor Coil (evaporator)",
            tone: "cold",
            step: heating
              ? "Outdoors the cold refrigerant absorbs heat from outdoor air, even well below room temperature."
              : "Indoors the cold refrigerant absorbs heat and moisture from the house air.",
          },
          {
            label: "Back to Compressor",
            tone: "cold",
            step: "Cool suction gas returns to the compressor and the cycle repeats.",
          },
        ]}
      />
    </div>
  );
}

const DIAGRAMS: Record<string, () => React.ReactElement> = {
  "refrigeration-cycle": () => (
    <FlowDiagram
      animated
      loop
      title="Vapor compression refrigeration cycle"
      note="heat is absorbed in the evaporator and rejected at the condenser"
      nodes={[
        {
          label: "Compressor",
          href: "/components/compressor",
          tone: "hot",
          step: "Low pressure vapor is compressed into hot, high pressure discharge gas.",
        },
        {
          label: "Condenser",
          href: "/components/condenser",
          tone: "hot",
          step: "The gas rejects heat, desuperheats, condenses to liquid and subcools slightly.",
        },
        {
          label: "Metering Device",
          href: "/components/txv",
          tone: "cold",
          step: "Pressure drops sharply, so the liquid can boil at a low temperature.",
        },
        {
          label: "Evaporator",
          href: "/components/evaporator",
          tone: "cold",
          step: "Refrigerant boils, absorbing heat from the air, and leaves as superheated vapor.",
        },
      ]}
    />
  ),
  "gas-furnace-sequence": () => (
    <FlowDiagram
      animated
      title="Gas furnace sequence of operation"
      note="each step must prove before the next one is allowed"
      nodes={[
        {
          label: "Thermostat Call",
          href: "/components/thermostat",
          tone: "electric",
          step: "The thermostat closes R to W, sending a 24V call for heat.",
        },
        {
          label: "Control Board",
          href: "/components/control-board",
          tone: "electric",
          step: "The board checks its safety string and starts the sequence.",
        },
        {
          label: "Inducer",
          href: "/components/inducer-motor",
          step: "The inducer runs first to establish draft through the heat exchanger and vent.",
        },
        {
          label: "Pressure Switch",
          href: "/components/pressure-switch",
          step: "Draft must prove the pressure switch closed before ignition is allowed. Never bypass it.",
        },
        {
          label: "Ignitor",
          href: "/components/hot-surface-ignitor",
          tone: "hot",
          step: "The ignitor warms up during a short pre-purge and warm-up period.",
        },
        {
          label: "Gas Valve",
          href: "/components/gas-valve",
          tone: "hot",
          step: "The valve opens and gas reaches the burners for a limited trial for ignition.",
        },
        {
          label: "Flame Sensor",
          href: "/components/flame-sensor",
          tone: "hot",
          step: "Flame rectification must prove flame, or the board closes the valve and retries or locks out.",
        },
        {
          label: "Blower",
          href: "/components/blower-motor",
          step: "After a fan-on delay the blower starts, moving heated air to the house.",
        },
      ]}
    />
  ),
  "heat-pump-cycle": () => <HeatPumpDiagram />,
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
  "contactor-circuit": () => (
    <FlowDiagram
      title="Contactor control and load sides"
      note="the 24V coil closes the contacts that switch line voltage — verify the circuit is de-energized before touching it"
      nodes={[
        { label: "24V from Y", tone: "electric" },
        { label: "Coil terminal", href: "/components/contactor", tone: "electric" },
        { label: "Contacts close" },
        { label: "Line in L1 / L2", tone: "hot" },
        { label: "Compressor", href: "/components/compressor", tone: "hot" },
        { label: "Condenser fan", tone: "cold" },
      ]}
    />
  ),
  "relay-terminals": () => (
    <FlowDiagram
      title="General purpose relay layout"
      note="a small control current switches a larger load circuit"
      nodes={[
        { label: "Coil 1 / 3", tone: "electric" },
        { label: "Common", tone: "electric" },
        { label: "Normally Open" },
        { label: "Normally Closed" },
        { label: "Load" },
      ]}
    />
  ),
  "transformer-wiring": () => (
    <FlowDiagram
      title="Control transformer"
      note="line voltage in, 24V control out — sizing is in VA"
      nodes={[
        { label: "Line voltage primary", tone: "hot" },
        { label: "Transformer", href: "/components/transformer", tone: "electric" },
        { label: "24V secondary R", tone: "electric" },
        { label: "Control loads", tone: "electric" },
        { label: "24V common C", tone: "electric" },
      ]}
    />
  ),
  "duct-system": () => (
    <FlowDiagram
      title="Duct system layout"
      note="total external static pressure is the sum of everything the blower must push and pull through"
      nodes={[
        { label: "Return grilles" },
        { label: "Return trunk" },
        { label: "Filter" },
        { label: "Air handler", href: "/equipment/air-handler" },
        { label: "Supply plenum" },
        { label: "Supply trunk" },
        { label: "Branch runs" },
        { label: "Registers" },
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

export function Diagram({ diagramKey, caption }: { diagramKey: string; caption?: string | undefined }) {
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

/** Every diagram the renderer knows about — used by the admin block editor. */
export const DIAGRAM_KEYS = Object.keys(DIAGRAMS);
