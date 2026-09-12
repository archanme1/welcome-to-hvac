import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import {
  adminContentListQuery,
  adminDeletePath,
  adminPathItemsQuery,
  adminPathsQuery,
  adminSavePath,
} from "@/lib/admin.functions";
import type { AdminPathItem } from "@/lib/admin.functions";
import { CONTENT_TYPE_LABEL, DIFFICULTY_LABEL, type Difficulty } from "@/lib/hvac-types";

export const Route = createFileRoute("/admin/paths")({ component: Paths });

const LEVELS: Difficulty[] = ["beginner", "apprentice", "technician", "advanced"];

type Draft = {
  id?: string;
  slug: string;
  title: string;
  description: string;
  level: Difficulty;
  is_published: boolean;
  sort_order: number;
};

const empty: Draft = {
  slug: "",
  title: "",
  description: "",
  level: "beginner",
  is_published: true,
  sort_order: 0,
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function Paths() {
  const { isStaff } = useAuth();
  const qc = useQueryClient();
  const { data: paths } = useQuery(adminPathsQuery(isStaff));
  const { data: topics } = useQuery(adminContentListQuery({}, isStaff));

  const [draft, setDraft] = useState<Draft>(empty);
  const [items, setItems] = useState<AdminPathItem[]>([]);
  const [saving, setSaving] = useState(false);

  const { data: savedItems } = useQuery(adminPathItemsQuery(draft.id ?? "", !!draft.id));

  useEffect(() => {
    if (draft.id && savedItems) setItems(savedItems);
  }, [draft.id, savedItems]);

  const reset = () => {
    setDraft(empty);
    setItems([]);
  };

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const a = next[index]!;
    const b = next[target]!;
    next[index] = b;
    next[target] = a;
    setItems(next.map((it, i) => ({ ...it, sort_order: i })));
  };

  const save = async () => {
    if (!draft.title || !draft.slug) {
      toast.error("Title and slug are required.");
      return;
    }
    setSaving(true);
    try {
      await adminSavePath({
        data: {
          id: draft.id,
          slug: draft.slug,
          title: draft.title,
          description: draft.description || null,
          level: draft.level,
          is_published: draft.is_published,
          sort_order: draft.sort_order,
          items,
        },
      });
      toast.success("Learning path saved.");
      reset();
      await qc.invalidateQueries({ queryKey: ["admin"] });
      await qc.invalidateQueries({ queryKey: ["hvac"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the learning path.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this learning path and its steps?")) return;
    try {
      await adminDeletePath({ data: { id } });
      toast.success("Learning path deleted.");
      if (draft.id === id) reset();
      await qc.invalidateQueries({ queryKey: ["admin"] });
      await qc.invalidateQueries({ queryKey: ["hvac"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete the learning path.");
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
      <div className="rounded-lg border border-border">
        <ul className="divide-y divide-border">
          {(paths ?? []).map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm">
              <span className="font-medium">{p.title}</span>
              <span className="text-xs text-muted-foreground">
                {DIFFICULTY_LABEL[p.level]} · {p.step_count} steps
                {p.is_published ? "" : " · hidden"}
              </span>
              <div className="ml-auto flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setItems([]);
                    setDraft({
                      id: p.id,
                      slug: p.slug,
                      title: p.title,
                      description: p.description ?? "",
                      level: p.level,
                      is_published: p.is_published,
                      sort_order: p.sort_order,
                    });
                  }}
                >
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(p.id)}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
          {(paths ?? []).length === 0 ? (
            <li className="px-4 py-6 text-sm text-muted-foreground">No learning paths yet.</li>
          ) : null}
        </ul>
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">{draft.id ? "Edit path" : "New path"}</h2>
        <div>
          <Label className="text-xs">Title</Label>
          <Input
            value={draft.title}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                title: e.target.value,
                slug: d.slug || slugify(e.target.value),
              }))
            }
          />
        </div>
        <div>
          <Label className="text-xs">Slug</Label>
          <Input
            value={draft.slug}
            onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value) })}
          />
        </div>
        <div>
          <Label className="text-xs">Description</Label>
          <Textarea
            rows={3}
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Level</Label>
            <Select
              value={draft.level}
              onValueChange={(v) => setDraft({ ...draft, level: v as Difficulty })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEVELS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {DIFFICULTY_LABEL[l]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Sort order</Label>
            <Input
              type="number"
              value={draft.sort_order}
              onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={draft.is_published}
            onCheckedChange={(v) => setDraft({ ...draft, is_published: v })}
          />
          <span className="text-sm">Visible to readers</span>
        </div>

        <div className="space-y-2 border-t border-border pt-3">
          <p className="text-xs font-medium">Steps in order</p>
          {items.map((item, i) => (
            <div key={i} className="space-y-1 rounded-md border border-border p-2">
              <div className="flex items-center gap-2">
                <span className="w-6 text-xs text-muted-foreground">{i + 1}.</span>
                <Select
                  value={item.content_id}
                  onValueChange={(v) => {
                    const next = [...items];
                    next[i] = { ...item, content_id: v };
                    setItems(next);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {(topics ?? []).map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title} · {CONTENT_TYPE_LABEL[t.content_type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Note (optional)"
                  value={item.note ?? ""}
                  onChange={(e) => {
                    const next = [...items];
                    next[i] = { ...item, note: e.target.value };
                    setItems(next);
                  }}
                />
                <Button size="sm" variant="ghost" onClick={() => move(i, -1)}>
                  ↑
                </Button>
                <Button size="sm" variant="ghost" onClick={() => move(i, 1)}>
                  ↓
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setItems(
                      items.filter((_, x) => x !== i).map((it, x) => ({ ...it, sort_order: x })),
                    )
                  }
                >
                  ✕
                </Button>
              </div>
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setItems([...items, { content_id: "", note: null, sort_order: items.length }])
            }
          >
            Add step
          </Button>
        </div>

        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save path"}
          </Button>
          {draft.id ? (
            <Button size="sm" variant="ghost" onClick={reset}>
              Cancel
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
