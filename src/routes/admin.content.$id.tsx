import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BlockEditor } from "@/components/admin/block-editor";
import { BlockRenderer } from "@/components/content/block-renderer";
import { DIAGRAM_KEYS } from "@/components/content/diagrams";
import { useAuth } from "@/hooks/use-auth";
import {
  adminCategoriesQuery,
  adminContentListQuery,
  adminContentQuery,
  adminDeleteContent,
  adminSaveContent,
} from "@/lib/admin.functions";
import type { AdminRelationship } from "@/lib/admin.functions";
import {
  CONTENT_TYPE_LABEL,
  CONTENT_TYPE_PATH,
  type ContentStatus,
  type ContentType,
  type Difficulty,
  type Section,
} from "@/lib/hvac-types";

export const Route = createFileRoute("/admin/content/$id")({ component: Editor });

const DIFFICULTIES: Difficulty[] = ["beginner", "apprentice", "technician", "advanced"];
const STATUSES: ContentStatus[] = ["draft", "review", "published", "archived"];
const LEVELS: Difficulty[] = ["beginner", "apprentice", "technician", "advanced"];
const RELATIONSHIP_TYPES = ["related", "component-of", "related-concept", "uses-tool", "troubleshoots"];

type Draft = {
  title: string;
  slug: string;
  content_type: ContentType;
  category_id: string;
  subcategory: string;
  summary: string;
  body: Section[];
  difficulty: Difficulty;
  status: ContentStatus;
  featured_image: string;
  tags: string;
  safety_note: string;
  code_notice: string;
  diagram_key: string;
  sort_order: number;
  source_name: string;
  source_url: string;
  source_reference: string;
  next_content_id: string;
  relationships: AdminRelationship[];
};

const emptyDraft: Draft = {
  title: "",
  slug: "",
  content_type: "concept",
  category_id: "none",
  subcategory: "",
  summary: "",
  body: [],
  difficulty: "beginner",
  status: "draft",
  featured_image: "",
  tags: "",
  safety_note: "",
  code_notice: "",
  diagram_key: "none",
  sort_order: 0,
  relationships: [],
  source_name: "",
  source_url: "",
  source_reference: "",
  next_content_id: "none",
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function Editor() {
  const { id } = useParams({ from: "/admin/content/$id" });
  const isNew = id === "new";
  const { isStaff } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery(adminContentQuery(id, isStaff && !isNew));
  const { data: categories } = useQuery(adminCategoriesQuery(isStaff));
  const { data: allTopics } = useQuery(adminContentListQuery({}, isStaff));
  const { data: savedLevels } = useQuery(adminTopicLevelsQuery(id, isStaff && !isNew));

  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [levels, setLevels] = useState<AdminTopicLevel[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (savedLevels) setLevels(savedLevels);
  }, [savedLevels]);

  useEffect(() => {
    const topic = data?.topic;
    if (!topic) return;
    setDraft({
      title: topic.title,
      slug: topic.slug,
      content_type: topic.content_type,
      category_id: topic.category_id ?? "none",
      subcategory: topic.subcategory ?? "",
      summary: topic.summary ?? "",
      body: (topic.body ?? []) as Section[],
      difficulty: topic.difficulty,
      status: topic.status,
      featured_image: topic.featured_image ?? "",
      tags: (topic.tags ?? []).join(", "),
      safety_note: topic.safety_note ?? "",
      code_notice: topic.code_notice ?? "",
      diagram_key: topic.diagram_key ?? "none",
      sort_order: topic.sort_order,
      relationships: data?.relationships ?? [],
      source_name: (topic as { source_name?: string | null }).source_name ?? "",
      source_url: (topic as { source_url?: string | null }).source_url ?? "",
      source_reference: (topic as { source_reference?: string | null }).source_reference ?? "",
      next_content_id:
        (topic as { next_content_id?: string | null }).next_content_id ?? "none",
    });
  }, [data]);

  const save = async (status?: ContentStatus) => {
    if (!draft.title || !draft.slug) {
      toast.error("A title and a URL slug are required.");
      return;
    }
    setSaving(true);
    try {
      const result = await adminSaveContent({
        data: {
          id: isNew ? undefined : id,
          title: draft.title,
          slug: draft.slug,
          content_type: draft.content_type,
          category_id: draft.category_id === "none" ? null : draft.category_id,
          subcategory: draft.subcategory || null,
          summary: draft.summary || null,
          body: draft.body,
          difficulty: draft.difficulty,
          status: status ?? draft.status,
          featured_image: draft.featured_image || null,
          tags: draft.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          safety_note: draft.safety_note || null,
          code_notice: draft.code_notice || null,
          diagram_key: draft.diagram_key === "none" ? null : draft.diagram_key,
          sort_order: draft.sort_order,
          source_name: draft.source_name || null,
          source_url: draft.source_url || null,
          source_reference: draft.source_reference || null,
          next_content_id: draft.next_content_id === "none" ? null : draft.next_content_id,
          relationships: draft.relationships,
        },
      });
      await adminSaveTopicLevels({ data: { contentId: result.id, levels } });
      if (status) setDraft((d) => ({ ...d, status }));
      toast.success("Saved.");
      await qc.invalidateQueries({ queryKey: ["admin"] });
      await qc.invalidateQueries({ queryKey: ["hvac"] });
      if (isNew) void navigate({ to: "/admin/content/$id", params: { id: result.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save this topic.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this topic permanently?")) return;
    try {
      await adminDeleteContent({ data: { id } });
      toast.success("Topic deleted.");
      await qc.invalidateQueries({ queryKey: ["admin"] });
      void navigate({ to: "/admin/content" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete this topic.");
    }
  };

  if (!isNew && isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant="ghost">
          <Link to="/admin/content">← All content</Link>
        </Button>
        <span className="text-sm text-muted-foreground">
          {isNew ? "New topic" : `Editing · ${draft.status}`}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => save("draft")} disabled={saving}>
            Save draft
          </Button>
          <Button size="sm" onClick={() => save("published")} disabled={saving}>
            Publish
          </Button>
          {!isNew && draft.status !== "archived" ? (
            <Button size="sm" variant="ghost" onClick={() => save("archived")} disabled={saving}>
              Archive
            </Button>
          ) : null}
          {!isNew ? (
            <Button size="sm" variant="ghost" onClick={remove}>
              Delete
            </Button>
          ) : null}
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="related">Related topics</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
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
              <Label className="text-xs">URL slug</Label>
              <Input
                value={draft.slug}
                onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value) })}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {CONTENT_TYPE_PATH[draft.content_type]}/{draft.slug || "…"}
              </p>
            </div>
            <div>
              <Label className="text-xs">Summary</Label>
              <Textarea
                rows={3}
                value={draft.summary}
                onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Type</Label>
                <Select
                  value={draft.content_type}
                  onValueChange={(v) => setDraft({ ...draft, content_type: v as ContentType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONTENT_TYPE_LABEL).map(([v, l]) => (
                      <SelectItem key={v} value={v}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Level</Label>
                <Select
                  value={draft.difficulty}
                  onValueChange={(v) => setDraft({ ...draft, difficulty: v as Difficulty })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Category</Label>
                <Select
                  value={draft.category_id}
                  onValueChange={(v) => setDraft({ ...draft, category_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {(categories ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Sub-category</Label>
                <Input
                  value={draft.subcategory}
                  onChange={(e) => setDraft({ ...draft, subcategory: e.target.value })}
                />
              </div>
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
                <Label className="text-xs">Sort order</Label>
                <Input
                  type="number"
                  value={draft.sort_order}
                  onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-xs">Tags (comma separated)</Label>
              <Input
                value={draft.tags}
                onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Header diagram</Label>
              <Select
                value={draft.diagram_key}
                onValueChange={(v) => setDraft({ ...draft, diagram_key: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No diagram</SelectItem>
                  {DIAGRAM_KEYS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Featured image URL</Label>
              <Input
                value={draft.featured_image}
                onChange={(e) => setDraft({ ...draft, featured_image: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Safety note</Label>
              <Textarea
                rows={3}
                value={draft.safety_note}
                onChange={(e) => setDraft({ ...draft, safety_note: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Local code notice</Label>
              <Textarea
                rows={3}
                value={draft.code_notice}
                onChange={(e) => setDraft({ ...draft, code_notice: e.target.value })}
              />
            </div>
            <div className="rounded-md border border-dashed border-border p-3">
              <p className="text-xs font-medium">Internal editorial reference (never published)</p>
              <div className="mt-2 grid gap-2">
                <Input
                  placeholder="Source name"
                  value={draft.source_name}
                  onChange={(e) => setDraft({ ...draft, source_name: e.target.value })}
                />
                <Input
                  placeholder="Source URL"
                  value={draft.source_url}
                  onChange={(e) => setDraft({ ...draft, source_url: e.target.value })}
                />
                <Textarea
                  rows={2}
                  placeholder="Review notes"
                  value={draft.source_reference}
                  onChange={(e) => setDraft({ ...draft, source_reference: e.target.value })}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="body" className="mt-4">
          <BlockEditor value={draft.body} onChange={(body) => setDraft({ ...draft, body })} />
        </TabsContent>

        <TabsContent value="related" className="mt-4 space-y-3">
          {draft.relationships.map((rel, i) => (
            <div key={i} className="flex flex-wrap gap-2">
              <Select
                value={rel.related_content_id}
                onValueChange={(v) => {
                  const next = [...draft.relationships];
                  next[i] = { ...rel, related_content_id: v };
                  setDraft({ ...draft, relationships: next });
                }}
              >
                <SelectTrigger className="w-full sm:w-[320px]">
                  <SelectValue placeholder="Choose a topic" />
                </SelectTrigger>
                <SelectContent>
                  {(allTopics ?? [])
                    .filter((t) => t.id !== id)
                    .map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title} · {CONTENT_TYPE_LABEL[t.content_type]}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Select
                value={rel.relationship_type}
                onValueChange={(v) => {
                  const next = [...draft.relationships];
                  next[i] = { ...rel, relationship_type: v };
                  setDraft({ ...draft, relationships: next });
                }}
              >
                <SelectTrigger className="w-[190px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setDraft({
                    ...draft,
                    relationships: draft.relationships.filter((_, x) => x !== i),
                  })
                }
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setDraft({
                ...draft,
                relationships: [
                  ...draft.relationships,
                  {
                    related_content_id: "",
                    relationship_type: "related",
                    sort_order: draft.relationships.length,
                  },
                ],
              })
            }
          >
            Add related topic
          </Button>
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <article className="prose-hvac max-w-3xl">
            <h1 className="text-2xl font-bold tracking-tight">{draft.title || "Untitled topic"}</h1>
            {draft.summary ? (
              <p className="mt-2 text-muted-foreground">{draft.summary}</p>
            ) : null}
            <div className="mt-6 space-y-8">
              {draft.body.map((section, i) => (
                <section key={i}>
                  {section.title ? (
                    <h2 className="text-lg font-semibold tracking-tight">{section.title}</h2>
                  ) : null}
                  <div className="mt-3 space-y-4">
                    {section.blocks.map((block, bi) => (
                      <BlockRenderer key={bi} block={block} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </article>
        </TabsContent>
      </Tabs>
    </div>
  );
}
