import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
  adminCategoriesQuery,
  adminDeleteCategory,
  adminSaveCategory,
} from "@/lib/admin.functions";
import type { ContentType } from "@/lib/hvac-types";
import { CONTENT_TYPE_LABEL } from "@/lib/hvac-types";

export const Route = createFileRoute("/admin/categories")({ component: Categories });

type Draft = {
  id?: string;
  slug: string;
  title: string;
  description: string;
  parent_id: string;
  content_type: string;
  icon: string;
  sort_order: number;
  is_published: boolean;
};

const empty: Draft = {
  slug: "",
  title: "",
  description: "",
  parent_id: "none",
  content_type: "none",
  icon: "",
  sort_order: 0,
  is_published: true,
};

function Categories() {
  const { isStaff } = useAuth();
  const qc = useQueryClient();
  const { data: categories } = useQuery(adminCategoriesQuery(isStaff));
  const [draft, setDraft] = useState<Draft>(empty);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!draft.title || !draft.slug) {
      toast.error("Title and slug are required.");
      return;
    }
    setSaving(true);
    try {
      await adminSaveCategory({
        data: {
          id: draft.id,
          slug: draft.slug,
          title: draft.title,
          description: draft.description || null,
          parent_id: draft.parent_id === "none" ? null : draft.parent_id,
          content_type: draft.content_type === "none" ? null : (draft.content_type as ContentType),
          icon: draft.icon || null,
          sort_order: draft.sort_order,
          is_published: draft.is_published,
        },
      });
      toast.success("Category saved.");
      setDraft(empty);
      await qc.invalidateQueries({ queryKey: ["admin"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the category.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this category? Topics will keep their content but lose the link.")) return;
    try {
      await adminDeleteCategory({ data: { id } });
      toast.success("Category deleted.");
      await qc.invalidateQueries({ queryKey: ["admin"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete the category.");
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="rounded-lg border border-border">
        <ul className="divide-y divide-border">
          {(categories ?? []).map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm">
              <span className="font-medium">{c.title}</span>
              <span className="text-xs text-muted-foreground">
                /{c.slug}
                {c.parent_id ? " · sub-category" : ""}
                {c.is_published ? "" : " · hidden"}
              </span>
              <div className="ml-auto flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setDraft({
                      id: c.id,
                      slug: c.slug,
                      title: c.title,
                      description: c.description ?? "",
                      parent_id: c.parent_id ?? "none",
                      content_type: c.content_type ?? "none",
                      icon: c.icon ?? "",
                      sort_order: c.sort_order,
                      is_published: c.is_published,
                    })
                  }
                >
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(c.id)}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">{draft.id ? "Edit category" : "New category"}</h2>
        <div>
          <Label className="text-xs">Title</Label>
          <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs">Slug</Label>
          <Input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs">Description</Label>
          <Textarea
            rows={3}
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
        </div>
        <div>
          <Label className="text-xs">Parent category</Label>
          <Select value={draft.parent_id} onValueChange={(v) => setDraft({ ...draft, parent_id: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No parent</SelectItem>
              {(categories ?? [])
                .filter((c) => c.id !== draft.id)
                .map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Default content type</Label>
          <Select
            value={draft.content_type}
            onValueChange={(v) => setDraft({ ...draft, content_type: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {Object.entries(CONTENT_TYPE_LABEL).map(([v, l]) => (
                <SelectItem key={v} value={v}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Sort order</Label>
            <Input
              type="number"
              value={draft.sort_order}
              onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label className="text-xs">Icon</Label>
            <Input value={draft.icon} onChange={(e) => setDraft({ ...draft, icon: e.target.value })} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={draft.is_published}
            onCheckedChange={(v) => setDraft({ ...draft, is_published: v })}
          />
          <span className="text-sm">Visible in navigation</span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save category"}
          </Button>
          {draft.id ? (
            <Button size="sm" variant="ghost" onClick={() => setDraft(empty)}>
              Cancel
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
