import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
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
  adminDeleteSymptom,
  adminSaveSymptom,
  adminSymptomLinksQuery,
  adminSymptomsQuery,
} from "@/lib/admin.functions";
import type { AdminSymptomLink } from "@/lib/admin.functions";
import { CONTENT_TYPE_LABEL, SYMPTOM_ROLE_LABEL } from "@/lib/hvac-types";

export const Route = createFileRoute("/admin/symptoms")({ component: Symptoms });

const SEVERITIES = ["normal", "urgent", "safety"];
const ROLES = Object.keys(SYMPTOM_ROLE_LABEL);

type Draft = {
  id?: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  is_published: boolean;
  sort_order: number;
};

const empty: Draft = {
  slug: "",
  title: "",
  description: "",
  category: "",
  severity: "normal",
  is_published: true,
  sort_order: 0,
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function Symptoms() {
  const { isStaff } = useAuth();
  const qc = useQueryClient();
  const { data: symptoms } = useQuery(adminSymptomsQuery(isStaff));
  const { data: topics } = useQuery(adminContentListQuery({}, isStaff));

  const [draft, setDraft] = useState<Draft>(empty);
  const [links, setLinks] = useState<AdminSymptomLink[]>([]);
  const [filter, setFilter] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: savedLinks } = useQuery(adminSymptomLinksQuery(draft.id ?? "", !!draft.id));

  useEffect(() => {
    if (draft.id && savedLinks) setLinks(savedLinks);
  }, [draft.id, savedLinks]);

  const visible = useMemo(() => {
    const rows = symptoms ?? [];
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (s) => s.title.toLowerCase().includes(q) || (s.category ?? "").toLowerCase().includes(q),
    );
  }, [symptoms, filter]);

  const reset = () => {
    setDraft(empty);
    setLinks([]);
  };

  const save = async () => {
    if (!draft.title || !draft.slug) {
      toast.error("Title and slug are required.");
      return;
    }
    setSaving(true);
    try {
      await adminSaveSymptom({
        data: {
          id: draft.id,
          slug: draft.slug,
          title: draft.title,
          description: draft.description || null,
          category: draft.category || null,
          severity: draft.severity,
          is_published: draft.is_published,
          sort_order: draft.sort_order,
          links,
        },
      });
      toast.success("Symptom saved.");
      reset();
      await qc.invalidateQueries({ queryKey: ["admin"] });
      await qc.invalidateQueries({ queryKey: ["hvac"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the symptom.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this symptom and its topic links?")) return;
    try {
      await adminDeleteSymptom({ data: { id } });
      toast.success("Symptom deleted.");
      if (draft.id === id) reset();
      await qc.invalidateQueries({ queryKey: ["admin"] });
      await qc.invalidateQueries({ queryKey: ["hvac"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete the symptom.");
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
      <div className="space-y-3">
        <Input
          placeholder="Filter symptoms…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <div className="rounded-lg border border-border">
          <ul className="divide-y divide-border">
            {visible.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm">
                <span className="font-medium">{s.title}</span>
                <span className="text-xs text-muted-foreground">
                  {s.category ?? "uncategorised"} · {s.severity} · {s.link_count} linked
                  {s.is_published ? "" : " · hidden"}
                </span>
                <div className="ml-auto flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setLinks([]);
                      setDraft({
                        id: s.id,
                        slug: s.slug,
                        title: s.title,
                        description: s.description ?? "",
                        category: s.category ?? "",
                        severity: s.severity,
                        is_published: s.is_published,
                        sort_order: s.sort_order,
                      });
                    }}
                  >
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(s.id)}>
                    Delete
                  </Button>
                </div>
              </li>
            ))}
            {visible.length === 0 ? (
              <li className="px-4 py-6 text-sm text-muted-foreground">No symptoms match.</li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">{draft.id ? "Edit symptom" : "New symptom"}</h2>
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
            <Label className="text-xs">Category</Label>
            <Input
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs">Severity</Label>
            <Select
              value={draft.severity}
              onValueChange={(v) => setDraft({ ...draft, severity: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEVERITIES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label className="text-xs">Sort order</Label>
          <Input
            type="number"
            value={draft.sort_order}
            onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })}
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={draft.is_published}
            onCheckedChange={(v) => setDraft({ ...draft, is_published: v })}
          />
          <span className="text-sm">Visible to readers</span>
        </div>

        <div className="space-y-2 border-t border-border pt-3">
          <p className="text-xs font-medium">Linked topics</p>
          {links.map((link, i) => (
            <div key={i} className="space-y-1 rounded-md border border-border p-2">
              <Select
                value={link.content_id}
                onValueChange={(v) => {
                  const next = [...links];
                  next[i] = { ...link, content_id: v };
                  setLinks(next);
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
              <div className="flex gap-2">
                <Select
                  value={link.role}
                  onValueChange={(v) => {
                    const next = [...links];
                    next[i] = { ...link, role: v };
                    setLinks(next);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {SYMPTOM_ROLE_LABEL[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Note (optional)"
                  value={link.note ?? ""}
                  onChange={(e) => {
                    const next = [...links];
                    next[i] = { ...link, note: e.target.value };
                    setLinks(next);
                  }}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setLinks(links.filter((_, x) => x !== i))}
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
              setLinks([
                ...links,
                { content_id: "", role: "related", note: null, sort_order: links.length },
              ])
            }
          >
            Add topic link
          </Button>
        </div>

        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save symptom"}
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
