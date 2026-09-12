import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  adminContentListQuery,
  adminSetContentStatus,
} from "@/lib/admin.functions";
import { CONTENT_TYPE_LABEL, CONTENT_TYPE_PATH } from "@/lib/hvac-types";
import type { ContentStatus } from "@/lib/hvac-types";

export const Route = createFileRoute("/admin/content")({ component: ContentList });

const TYPES = ["all", "equipment", "component", "concept", "procedure", "troubleshooting", "tool"];
const STATUSES = ["all", "published", "draft", "archived"];

function ContentList() {
  const { isStaff } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [categoryId, setCategoryId] = useState("all");

  const filters = { search, type, status, categoryId };
  const { data: rows, isFetching } = useQuery(adminContentListQuery(filters, isStaff));
  const { data: categories } = useQuery(adminCategoriesQuery(isStaff));

  const setStatusFor = async (id: string, next: ContentStatus) => {
    try {
      await adminSetContentStatus({ data: { id, status: next } });
      toast.success(`Moved to ${next}.`);
      await qc.invalidateQueries({ queryKey: ["admin"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update the topic.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="w-full sm:w-64"
          placeholder="Search titles…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t === "all" ? "All types" : CONTENT_TYPE_LABEL[t as keyof typeof CONTENT_TYPE_LABEL]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "all" ? "All statuses" : s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="w-[190px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {(categories ?? []).map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button asChild size="sm" className="ml-auto">
          <Link to="/admin/content/$id" params={{ id: "new" }}>
            New topic
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border border-border">
        <ul className="divide-y divide-border">
          {(rows ?? []).map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm">
              <Link
                to="/admin/content/$id"
                params={{ id: r.id }}
                className="font-medium hover:underline"
              >
                {r.title}
              </Link>
              <span className="text-xs text-muted-foreground">
                {CONTENT_TYPE_LABEL[r.content_type]} · {r.difficulty} · {r.status}
              </span>
              <div className="ml-auto flex flex-wrap gap-1">
                <Button asChild size="sm" variant="ghost">
                  <a
                    href={`${CONTENT_TYPE_PATH[r.content_type]}/${r.slug}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Preview
                  </a>
                </Button>
                {r.status !== "published" ? (
                  <Button size="sm" variant="outline" onClick={() => setStatusFor(r.id, "published")}>
                    Publish
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setStatusFor(r.id, "draft")}>
                    Unpublish
                  </Button>
                )}
                {r.status !== "archived" ? (
                  <Button size="sm" variant="ghost" onClick={() => setStatusFor(r.id, "archived")}>
                    Archive
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
          {!isFetching && !(rows ?? []).length ? (
            <li className="px-4 py-6 text-sm text-muted-foreground">No topics match these filters.</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
