import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DIAGRAM_KEYS } from "@/components/content/diagrams";
import type { Block, CalloutVariant, Section } from "@/lib/hvac-types";

const BLOCK_TYPES: { value: Block["type"]; label: string }[] = [
  { value: "paragraph", label: "Paragraph" },
  { value: "heading", label: "Heading" },
  { value: "subheading", label: "Subheading" },
  { value: "list", label: "List" },
  { value: "steps", label: "Steps" },
  { value: "table", label: "Table" },
  { value: "definition", label: "Definition" },
  { value: "formula", label: "Formula" },
  { value: "callout", label: "Callout" },
  { value: "diagram", label: "Diagram" },
  { value: "image", label: "Image" },
  { value: "symptom", label: "Symptom" },
  { value: "checks", label: "Checks (what to check / what it means)" },
];

const CALLOUT_VARIANTS: CalloutVariant[] = ["note", "safety", "tip", "important", "code-notice"];

function emptyBlock(type: Block["type"]): Block {
  switch (type) {
    case "heading":
    case "subheading":
      return { type, text: "" };
    case "list":
      return { type: "list", items: [""] };
    case "steps":
      return { type: "steps", items: [""] };
    case "table":
      return { type: "table", headers: ["Column 1", "Column 2"], rows: [["", ""]] };
    case "definition":
      return { type: "definition", term: "", text: "" };
    case "formula":
      return { type: "formula", expression: "", text: "" };
    case "callout":
      return { type: "callout", variant: "note", title: "", text: "" };
    case "diagram":
      return { type: "diagram", diagram: DIAGRAM_KEYS[0] ?? "", caption: "" };
    case "image":
      return { type: "image", url: "", alt: "", caption: "" };
    case "symptom":
      return { type: "symptom", text: "" };
    case "checks":
      return { type: "checks", items: [{ check: "", meaning: "" }] };
    default:
      return { type: "paragraph", text: "" };
  }
}

function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item as T);
  return next;
}

function slugish(text: string) {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || `section-${Math.random().toString(36).slice(2, 7)}`
  );
}

export function BlockEditor({
  value,
  onChange,
}: {
  value: Section[];
  onChange: (next: Section[]) => void;
}) {
  const setSection = (index: number, section: Section) => {
    const next = [...value];
    next[index] = section;
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {value.map((section, si) => (
        <div key={si} className="rounded-lg border border-border bg-card p-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[200px] flex-1">
              <Label className="text-xs">Section title</Label>
              <Input
                value={section.title}
                onChange={(e) =>
                  setSection(si, {
                    ...section,
                    title: e.target.value,
                    id: section.id || slugish(e.target.value),
                  })
                }
                placeholder="How it works"
              />
            </div>
            <div className="flex gap-1">
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => onChange(move(value, si, si - 1))}
                aria-label="Move section up"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => onChange(move(value, si, si + 1))}
                aria-label="Move section down"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => onChange(value.filter((_, i) => i !== si))}
                aria-label="Delete section"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {section.blocks.map((block, bi) => (
              <div key={bi} className="rounded-md border border-border/70 bg-muted/30 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={block.type}
                    onValueChange={(t) => {
                      const blocks = [...section.blocks];
                      blocks[bi] = emptyBlock(t as Block["type"]);
                      setSection(si, { ...section, blocks });
                    }}
                  >
                    <SelectTrigger className="h-8 w-[220px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOCK_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="ml-auto flex gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() =>
                        setSection(si, { ...section, blocks: move(section.blocks, bi, bi - 1) })
                      }
                      aria-label="Move block up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() =>
                        setSection(si, { ...section, blocks: move(section.blocks, bi, bi + 1) })
                      }
                      aria-label="Move block down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() =>
                        setSection(si, {
                          ...section,
                          blocks: section.blocks.filter((_, i) => i !== bi),
                        })
                      }
                      aria-label="Delete block"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-2">
                  <BlockFields
                    block={block}
                    onChange={(next) => {
                      const blocks = [...section.blocks];
                      blocks[bi] = next;
                      setSection(si, { ...section, blocks });
                    }}
                  />
                </div>
              </div>
            ))}

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setSection(si, { ...section, blocks: [...section.blocks, emptyBlock("paragraph")] })
              }
            >
              <Plus className="mr-1 h-4 w-4" /> Add block
            </Button>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="secondary"
        onClick={() =>
          onChange([
            ...value,
            { id: `section-${value.length + 1}`, title: "", blocks: [emptyBlock("paragraph")] },
          ])
        }
      >
        <Plus className="mr-1 h-4 w-4" /> Add section
      </Button>
    </div>
  );
}

function BlockFields({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  switch (block.type) {
    case "heading":
    case "subheading":
    case "paragraph":
    case "symptom":
      return (
        <Textarea
          rows={block.type === "paragraph" ? 4 : 2}
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
          placeholder="Text"
        />
      );

    case "list":
    case "steps":
      return (
        <ListFields
          items={block.items}
          onChange={(items) => onChange({ ...block, items })}
          label={block.type === "steps" ? "Step" : "Item"}
        />
      );

    case "definition":
      return (
        <div className="grid gap-2 sm:grid-cols-[200px_1fr]">
          <Input
            value={block.term}
            onChange={(e) => onChange({ ...block, term: e.target.value })}
            placeholder="Term"
          />
          <Textarea
            rows={2}
            value={block.text}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
            placeholder="Definition"
          />
        </div>
      );

    case "formula":
      return (
        <div className="grid gap-2">
          <Input
            value={block.expression}
            onChange={(e) => onChange({ ...block, expression: e.target.value })}
            placeholder="Superheat = suction line temp − saturation temp"
          />
          <Input
            value={block.text ?? ""}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
            placeholder="Explanation (optional)"
          />
        </div>
      );

    case "callout":
      return (
        <div className="grid gap-2">
          <div className="flex flex-wrap gap-2">
            <Select
              value={block.variant}
              onValueChange={(v) => onChange({ ...block, variant: v as CalloutVariant })}
            >
              <SelectTrigger className="h-9 w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CALLOUT_VARIANTS.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              className="flex-1"
              value={block.title ?? ""}
              onChange={(e) => onChange({ ...block, title: e.target.value })}
              placeholder="Title (optional)"
            />
          </div>
          <Textarea
            rows={3}
            value={block.text}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
            placeholder="Callout text"
          />
        </div>
      );

    case "diagram":
      return (
        <div className="grid gap-2 sm:grid-cols-[240px_1fr]">
          <Select value={block.diagram} onValueChange={(d) => onChange({ ...block, diagram: d })}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Diagram" />
            </SelectTrigger>
            <SelectContent>
              {DIAGRAM_KEYS.map((k) => (
                <SelectItem key={k} value={k}>
                  {k}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={block.caption ?? ""}
            onChange={(e) => onChange({ ...block, caption: e.target.value })}
            placeholder="Caption (optional)"
          />
        </div>
      );

    case "image":
      return (
        <div className="grid gap-2">
          <Input
            value={block.url}
            onChange={(e) => onChange({ ...block, url: e.target.value })}
            placeholder="Image URL"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              value={block.alt}
              onChange={(e) => onChange({ ...block, alt: e.target.value })}
              placeholder="Alt text (required)"
            />
            <Input
              value={block.caption ?? ""}
              onChange={(e) => onChange({ ...block, caption: e.target.value })}
              placeholder="Caption (optional)"
            />
          </div>
        </div>
      );

    case "table":
      return (
        <TableFields
          headers={block.headers}
          rows={block.rows}
          onChange={(headers, rows) => onChange({ ...block, headers, rows })}
        />
      );

    case "checks":
      return (
        <div className="space-y-2">
          {block.items.map((item, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <Input
                value={item.check}
                onChange={(e) => {
                  const items = [...block.items];
                  items[i] = { ...item, check: e.target.value };
                  onChange({ ...block, items });
                }}
                placeholder="What to check"
              />
              <Input
                value={item.meaning}
                onChange={(e) => {
                  const items = [...block.items];
                  items[i] = { ...item, meaning: e.target.value };
                  onChange({ ...block, items });
                }}
                placeholder="What the result means"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => onChange({ ...block, items: block.items.filter((_, x) => x !== i) })}
                aria-label="Remove check"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onChange({ ...block, items: [...block.items, { check: "", meaning: "" }] })}
          >
            <Plus className="mr-1 h-4 w-4" /> Add check
          </Button>
        </div>
      );

    default:
      return null;
  }
}

function ListFields({
  items,
  onChange,
  label,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  label: string;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <Input
            value={item}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              onChange(next);
            }}
            placeholder={`${label} ${i + 1}`}
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => onChange(items.filter((_, x) => x !== i))}
            aria-label="Remove item"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" onClick={() => onChange([...items, ""])}>
        <Plus className="mr-1 h-4 w-4" /> Add {label.toLowerCase()}
      </Button>
    </div>
  );
}

function TableFields({
  headers,
  rows,
  onChange,
}: {
  headers: string[];
  rows: string[][];
  onChange: (headers: string[], rows: string[][]) => void;
}) {
  const setHeader = (i: number, text: string) => {
    const next = [...headers];
    next[i] = text;
    onChange(next, rows);
  };
  const setCell = (r: number, c: number, text: string) => {
    const next = rows.map((row) => [...row]);
    next[r]![c] = text;
    onChange(headers, next);
  };

  return (
    <div className="space-y-2 overflow-x-auto">
      <div className="flex gap-2">
        {headers.map((h, i) => (
          <Input
            key={i}
            className="min-w-[140px] font-medium"
            value={h}
            onChange={(e) => setHeader(i, e.target.value)}
            placeholder={`Header ${i + 1}`}
          />
        ))}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            onChange([...headers, `Column ${headers.length + 1}`], rows.map((r) => [...r, ""]))
          }
        >
          + Col
        </Button>
      </div>
      {rows.map((row, r) => (
        <div key={r} className="flex gap-2">
          {headers.map((_, c) => (
            <Input
              key={c}
              className="min-w-[140px]"
              value={row[c] ?? ""}
              onChange={(e) => setCell(r, c, e.target.value)}
            />
          ))}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => onChange(headers, rows.filter((_, x) => x !== r))}
            aria-label="Remove row"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => onChange(headers, [...rows, headers.map(() => "")])}
      >
        <Plus className="mr-1 h-4 w-4" /> Add row
      </Button>
    </div>
  );
}
