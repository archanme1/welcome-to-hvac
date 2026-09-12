import { AlertTriangle, Info, Lightbulb, Scale, CircleAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import type { CalloutVariant } from "@/lib/hvac-types";

const VARIANTS: Record<
  CalloutVariant,
  { label: string; icon: typeof Info; className: string; iconClass: string }
> = {
  note: {
    label: "Note",
    icon: Info,
    className: "bg-note text-note-foreground border-note-border",
    iconClass: "text-note-foreground",
  },
  safety: {
    label: "Safety",
    icon: AlertTriangle,
    className: "bg-safety text-safety-foreground border-safety-border",
    iconClass: "text-safety-foreground",
  },
  tip: {
    label: "Technician Tip",
    icon: Lightbulb,
    className: "bg-tip text-tip-foreground border-tip-border",
    iconClass: "text-tip-foreground",
  },
  important: {
    label: "Important",
    icon: CircleAlert,
    className: "bg-note text-note-foreground border-note-border",
    iconClass: "text-note-foreground",
  },
  "code-notice": {
    label: "Local Code Notice",
    icon: Scale,
    className: "bg-codenotice text-codenotice-foreground border-codenotice-border",
    iconClass: "text-codenotice-foreground",
  },
};

export function Callout({
  variant = "note",
  title,
  children,
}: {
  variant?: CalloutVariant | undefined;
  title?: string | undefined;
  children: React.ReactNode;
}) {
  const config = VARIANTS[variant];
  const Icon = config.icon;

  return (
    <div className={cn("mt-6 rounded-lg border px-4 py-3.5", config.className)}>
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4 shrink-0", config.iconClass)} />
        <p className="text-xs font-semibold uppercase tracking-wide">{title ?? config.label}</p>
      </div>
      <div className="mt-1.5 text-[0.9rem] leading-6">{children}</div>
    </div>
  );
}
