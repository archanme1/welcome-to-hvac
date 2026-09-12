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
  adminDeleteTree,
  adminSaveTree,
  adminTreeNodesQuery,
  adminTreesQuery,
} from "@/lib/admin.functions";
import type { AdminTreeNode } from "@/lib/admin.functions";
import { CONTENT_TYPE_LABEL, type ContentStatus } from "@/lib/hvac-types";

export const Route = createFileRoute("/admin/diagnostics")({ component: Diagnostics });

const STATUSES: ContentStatus[] = ["draft", "review", "published", "archived"];

type Draft = {
  id?: string;
  slug: string;
  title: string;
  intro: string;
  safety_note: string;
  status: ContentStatus;
  content_id: string;
};

const empty: Draft = {
  slug: "",
  title: "",
  intro: "",
  safety_note: "",
  status: "draft",
  content_id: "none",
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function emptyNode(index: number): AdminTreeNode {
  return {
    key: `step-${index + 1}`,
    is_root: index === 0,
    question: "",
    observation: null,
    safety_note: null,
    possible_causes: [],
    answers: [],
    related_content_id: null,
    sort_order: index,
  };
}

function Diagnostics() {
  const { isStaff } = useAuth();
  const qc = useQueryClient();
  const { data: trees } = useQuery(adminTreesQuery(isStaff));
  const { data: topics } = useQuery(adminContentListQuery({}, isStaff));

  const [draft, setDraft] = useState<Draft>(empty);
  const [nodes, setNodes] = useState<AdminTreeNode[]>([]);
  const [saving, setSaving] = useState(false);

  const { data: savedNodes } = useQuery(adminTreeNodesQuery(draft.id ?? "", !!draft.id));

  useEffect(() => {
    if (draft.id && savedNodes) setNodes(savedNodes);
  }, [draft.id, savedNodes]);

  const warnings = useMemo(() => {
    const list: string[] = [];
    const keys = nodes.map((n) => n.key);
    const roots = nodes.filter((n) => n.is_root);
    if (nodes.length && roots.length !== 1) list.push("A tree needs exactly one starting step.");
    const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
    if (dupes.length) list.push(`Duplicate step keys: ${[...new Set(dupes)].join(", ")}`);
    for (const n of nodes) {
      for (const a of n.answers) {
        if (a.next && !keys.includes(a.next)) {
          list.push(`Step "${n.key}" points to a missing step "${a.next}".`);
        }
        if (!a.next && !a.result) {
          list.push(`Step "${n.key}" has an answer with no next step and no outcome.`);
        }
      }
    }
    return list;
  }, [nodes]);

  const reset = () => {
    setDraft(empty);
    setNodes([]);
  };

  const patchNode = (i: number, patch: Partial<AdminTreeNode>) => {
    const next = [...nodes];
    next[i] = { ...next[i]!, ...patch };
    setNodes(next);
  };

  const save = async () => {
    if (!draft.title || !draft.slug) {
      toast.error("Title and slug are required.");
      return;
    }
    setSaving(true);
    try {
      await adminSaveTree({
        data: {
          id: draft.id,
          slug: draft.slug,
          title: draft.title,
          intro: draft.intro || null,
          safety_note: draft.safety_note || null,
          status: draft.status,
          content_id: draft.content_id === "none" ? null : draft.content_id,
          symptom_id: null,
          nodes: nodes.map((n, i) => ({ ...n, sort_order: i })),
        },
      });
      toast.success("Diagnostic tree saved.");
      reset();
      await qc.invalidateQueries({ queryKey: ["admin"] });
      await qc.invalidateQueries({ queryKey: ["hvac"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the diagnostic tree.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this diagnostic tree and all of its steps?")) return;
    try {
      await adminDeleteTree({ data: { id } });
      toast.success("Diagnostic tree deleted.");
      if (draft.id === id) reset();
      await qc.invalidateQueries({ queryKey: ["admin"] });
      await qc.invalidateQueries({ queryKey: ["hvac"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete the diagnostic tree.");
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_480px]">
      <div className="rounded-lg border border-border">
        <ul className="divide-y divide-border">
          {(trees ?? []).map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm">
              <span className="font-medium">{t.title}</span>
              <span className="text-xs text-muted-foreground">
                {t.status} · {t.node_count} steps
              </span>
              <div className="ml-auto flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setNodes([]);
                    setDraft({
                      id: t.id,
                      slug: t.slug,
                      title: t.title,
                      intro: t.intro ?? "",
                      safety_note: t.safety_note ?? "",
                      status: t.status,
                      content_id: t.content_id ?? "none",
                    });
                  }}
                >
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(t.id)}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
          {(trees ?? []).length === 0 ? (
            <li className="px-4 py-6 text-sm text-muted-foreground">No diagnostic trees yet.</li>
          ) : null}
        </ul>
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">{draft.id ? "Edit tree" : "New tree"}</h2>
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
          <Label className="text-xs">Intro</Label>
          <Textarea
            rows={2}
            value={draft.intro}
            onChange={(e) => setDraft({ ...draft, intro: e.target.value })}
          />
        </div>
        <div>
          <Label className="text-xs">Safety note</Label>
          <Textarea
            rows={2}
            value={draft.safety_note}
            onChange={(e) => setDraft({ ...draft, safety_note: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Status</Label>
            <Select
              value={draft.status}
              onValueChange={(v) => setDraft({ ...draft, status: v as ContentStatus })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Attached topic</Label>
            <Select
              value={draft.content_id}
              onValueChange={(v) => setDraft({ ...draft, content_id: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No topic</SelectItem>
                {(topics ?? []).map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.title} · {CONTENT_TYPE_LABEL[t.content_type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {warnings.length ? (
          <ul className="space-y-1 rounded-md border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        ) : null}

        <div className="space-y-3 border-t border-border pt-3">
          <p className="text-xs font-medium">Steps</p>
          {nodes.map((node, i) => (
            <div key={i} className="space-y-2 rounded-md border border-border p-3">
              <div className="flex items-center gap-2">
                <Input
                  className="w-40"
                  placeholder="step key"
                  value={node.key}
                  onChange={(e) => patchNode(i, { key: slugify(e.target.value) })}
                />
                <div className="flex items-center gap-2">
                  <Switch
                    checked={node.is_root}
                    onCheckedChange={(v) =>
                      setNodes(nodes.map((n, x) => ({ ...n, is_root: x === i ? v : false })))
                    }
                  />
                  <span className="text-xs">Start here</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto"
                  onClick={() => setNodes(nodes.filter((_, x) => x !== i))}
                >
                  ✕
                </Button>
              </div>
              <Textarea
                rows={2}
                placeholder="Question asked at this step"
                value={node.question}
                onChange={(e) => patchNode(i, { question: e.target.value })}
              />
              <Textarea
                rows={2}
                placeholder="What to observe or measure (optional)"
                value={node.observation ?? ""}
                onChange={(e) => patchNode(i, { observation: e.target.value || null })}
              />
              <Textarea
                rows={2}
                placeholder="Safety note for this step (optional)"
                value={node.safety_note ?? ""}
                onChange={(e) => patchNode(i, { safety_note: e.target.value || null })}
              />
              <Input
                placeholder="Possible causes, comma separated"
                value={node.possible_causes.join(", ")}
                onChange={(e) =>
                  patchNode(i, {
                    possible_causes: e.target.value
                      .split(",")
                      .map((c) => c.trim())
                      .filter(Boolean),
                  })
                }
              />
              <Select
                value={node.related_content_id ?? "none"}
                onValueChange={(v) => patchNode(i, { related_content_id: v === "none" ? null : v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No related topic</SelectItem>
                  {(topics ?? []).map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Answers</p>
                {node.answers.map((answer, ai) => (
                  <div key={ai} className="flex flex-wrap gap-2">
                    <Input
                      className="w-36"
                      placeholder="Answer"
                      value={answer.label}
                      onChange={(e) => {
                        const answers = [...node.answers];
                        answers[ai] = { ...answer, label: e.target.value };
                        patchNode(i, { answers });
                      }}
                    />
                    <Select
                      value={answer.next ?? "result"}
                      onValueChange={(v) => {
                        const answers = [...node.answers];
                        answers[ai] =
                          v === "result"
                            ? { ...answer, next: null }
                            : { ...answer, next: v, result: null };
                        patchNode(i, { answers });
                      }}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="result">Ends with outcome</SelectItem>
                        {nodes
                          .filter((n) => n.key && n.key !== node.key)
                          .map((n) => (
                            <SelectItem key={n.key} value={n.key}>
                              Go to {n.key}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {!answer.next ? (
                      <Input
                        className="flex-1"
                        placeholder="Outcome shown to the reader"
                        value={answer.result ?? ""}
                        onChange={(e) => {
                          const answers = [...node.answers];
                          answers[ai] = { ...answer, result: e.target.value };
                          patchNode(i, { answers });
                        }}
                      />
                    ) : null}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        patchNode(i, { answers: node.answers.filter((_, x) => x !== ai) })
                      }
                    >
                      ✕
                    </Button>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    patchNode(i, {
                      answers: [...node.answers, { label: "", next: null, result: "" }],
                    })
                  }
                >
                  Add answer
                </Button>
              </div>
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setNodes([...nodes, emptyNode(nodes.length)])}
          >
            Add step
          </Button>
        </div>

        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save tree"}
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
