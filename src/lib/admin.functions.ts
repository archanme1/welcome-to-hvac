import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type {
  CategoryRecord,
  ContentRecord,
  ContentStatus,
  ContentType,
  Difficulty,
  Section,
} from "./hvac-types";

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

type Ctx = { supabase: any; userId: string };

async function assertStaff(context: Ctx) {
  const { data } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
  if (!data) throw new Error("Editor or administrator access required.");
}

async function assertAdmin(context: Ctx) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Administrator access required.");
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context as Ctx);
    const db = context.supabase as any;
    const count = async (table: string, filter?: (q: any) => any) => {
      let q = db.from(table).select("id", { count: "exact", head: true });
      if (filter) q = filter(q);
      const { count: n } = await q;
      return n ?? 0;
    };

    const [
      published,
      drafts,
      archived,
      categories,
      questions,
      quizzes,
      scenarios,
      symptoms,
      paths,
      trees,
    ] = await Promise.all([
      count("content", (q) => q.eq("status", "published")),
      count("content", (q) => q.eq("status", "draft")),
      count("content", (q) => q.eq("status", "archived")),
      count("categories"),
      count("practice_questions"),
      count("quizzes"),
      count("scenarios"),
      count("symptoms"),
      count("learning_paths"),
      count("diagnostic_trees"),
    ]);

    const { data: recent } = await db
      .from("content")
      .select("id, title, slug, content_type, status, updated_at")
      .order("updated_at", { ascending: false })
      .limit(8);

    return {
      published,
      drafts,
      archived,
      categories,
      questions,
      quizzes,
      scenarios,
      symptoms,
      paths,
      trees,
      recent: (recent ?? []) as {
        id: string;
        title: string;
        slug: string;
        content_type: ContentType;
        status: ContentStatus;
        updated_at: string;
      }[],
    };
  });

export const adminOverviewQuery = (enabled: boolean) =>
  queryOptions({
    queryKey: ["admin", "overview"],
    queryFn: () => adminOverview(),
    enabled,
  });

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

export type AdminContentRow = {
  id: string;
  title: string;
  slug: string;
  content_type: ContentType;
  status: ContentStatus;
  difficulty: Difficulty;
  category_id: string | null;
  updated_at: string;
};

export const adminListContent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { search?: string; type?: string; status?: string; categoryId?: string }) => data,
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context as Ctx);
    let q: any = (context.supabase as any)
      .from("content")
      .select("id, title, slug, content_type, status, difficulty, category_id, updated_at")
      .order("updated_at", { ascending: false })
      .limit(500);

    if (data.search) q = q.ilike("title", `%${data.search}%`);
    if (data.type && data.type !== "all") q = q.eq("content_type", data.type);
    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    if (data.categoryId && data.categoryId !== "all") q = q.eq("category_id", data.categoryId);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as AdminContentRow[];
  });

export const adminContentListQuery = (
  filters: { search?: string; type?: string; status?: string; categoryId?: string },
  enabled: boolean,
) =>
  queryOptions({
    queryKey: ["admin", "content", filters],
    queryFn: () => adminListContent({ data: filters }),
    enabled,
  });

export type AdminRelationship = {
  id?: string;
  related_content_id: string;
  relationship_type: string;
  sort_order: number;
};

export const adminGetContent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    await assertStaff(context as Ctx);
    const [{ data: topic, error }, { data: rels }] = await Promise.all([
      context.supabase.from("content").select("*").eq("id", data.id).maybeSingle(),
      context.supabase
        .from("content_relationships")
        .select("id, related_content_id, relationship_type, sort_order")
        .eq("content_id", data.id)
        .order("sort_order"),
    ]);
    if (error) throw new Error(error.message);
    return {
      topic: (topic ?? null) as ContentRecord | null,
      relationships: (rels ?? []) as AdminRelationship[],
    };
  });

export const adminContentQuery = (id: string, enabled: boolean) =>
  queryOptions({
    queryKey: ["admin", "content-item", id],
    queryFn: () => adminGetContent({ data: { id } }),
    enabled,
  });

export type ContentInput = {
  id?: string | undefined;
  title: string;
  slug: string;
  content_type: ContentType;
  category_id: string | null;
  subcategory: string | null;
  summary: string | null;
  body: Section[];
  difficulty: Difficulty;
  status: ContentStatus;
  featured_image: string | null;
  tags: string[];
  safety_note: string | null;
  code_notice: string | null;
  diagram_key: string | null;
  sort_order: number;
  source_name: string | null;
  source_url: string | null;
  source_reference: string | null;
  next_content_id: string | null;
  relationships: AdminRelationship[];
};

export const adminSaveContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: ContentInput) => data)
  .handler(async ({ data, context }) => {
    await assertStaff(context as Ctx);
    const db = context.supabase as any;
    const { id, relationships, ...fields } = data;

    const searchText = [
      fields.title,
      fields.summary ?? "",
      fields.subcategory ?? "",
      fields.tags.join(" "),
    ]
      .join(" ")
      .toLowerCase();

    const payload = { ...fields, search_text: searchText };

    let contentId = id;
    if (contentId) {
      const { error } = await db.from("content").update(payload).eq("id", contentId);
      if (error) throw new Error(error.message);
    } else {
      const { data: inserted, error } = await db
        .from("content")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      contentId = inserted.id as string;
    }

    await db.from("content_relationships").delete().eq("content_id", contentId);
    const clean = relationships.filter((r) => r.related_content_id && r.related_content_id !== contentId);
    if (clean.length) {
      const { error } = await db.from("content_relationships").insert(
        clean.map((r, i) => ({
          content_id: contentId,
          related_content_id: r.related_content_id,
          relationship_type: r.relationship_type || "related",
          sort_order: r.sort_order ?? i,
        })),
      );
      if (error) throw new Error(error.message);
    }

    return { id: contentId as string };
  });

export const adminSetContentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; status: ContentStatus }) => data)
  .handler(async ({ data, context }) => {
    await assertStaff(context as Ctx);
    const { error } = await context.supabase
      .from("content")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx);
    const db = context.supabase as any;
    await db.from("content_relationships").delete().eq("content_id", data.id);
    await db.from("content_relationships").delete().eq("related_content_id", data.id);
    const { error } = await db.from("content").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

export const adminListCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context as Ctx);
    const { data } = await context.supabase
      .from("categories")
      .select("*")
      .order("sort_order")
      .order("title");
    return (data ?? []) as (CategoryRecord & { is_published: boolean })[];
  });

export const adminCategoriesQuery = (enabled: boolean) =>
  queryOptions({
    queryKey: ["admin", "categories"],
    queryFn: () => adminListCategories(),
    enabled,
  });

export const adminSaveCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      id?: string | undefined;
      slug: string;
      title: string;
      description: string | null;
      parent_id: string | null;
      content_type: ContentType | null;
      icon: string | null;
      sort_order: number;
      is_published: boolean;
    }) => data,
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context as Ctx);
    const { id, ...fields } = data;
    if (id) {
      const { error } = await context.supabase.from("categories").update(fields).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: row, error } = await context.supabase
      .from("categories")
      .insert(fields)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

export const adminDeleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx);
    const { error } = await context.supabase.from("categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Practice                                                            */
/* ------------------------------------------------------------------ */

export type AdminQuestionRow = {
  id: string;
  content_id: string | null;
  question_type: string;
  prompt: string;
  options: { id: string; text: string }[] | null;
  correct_answer: Json;
  explanation: string | null;
  difficulty: Difficulty;
  status: ContentStatus;
  sort_order: number;
};

export type AdminQuizRow = {
  id: string;
  content_id: string | null;
  title: string;
  description: string | null;
  question_ids: string[] | null;
  status: ContentStatus;
};

export type AdminScenarioRow = {
  id: string;
  content_id: string | null;
  kind: string;
  title: string;
  setup: string | null;
  symptoms: Json;
  steps: Json;
  safety_note: string | null;
  difficulty: Difficulty;
  status: ContentStatus;
};

export const adminListPractice = createServerFn({ method: "GET" })

  .middleware([requireSupabaseAuth])
  .inputValidator((data: { contentId: string }) => data)
  .handler(async ({ data, context }) => {
    await assertStaff(context as Ctx);
    const db = context.supabase as any;
    const [questions, quizzes, scenarios] = await Promise.all([
      db
        .from("practice_questions")
        .select("*")
        .eq("content_id", data.contentId)
        .order("sort_order"),
      db.from("quizzes").select("*").eq("content_id", data.contentId).order("created_at"),
      db.from("scenarios").select("*").eq("content_id", data.contentId).order("created_at"),
    ]);
    return {
      questions: (questions.data ?? []) as AdminQuestionRow[],
      quizzes: (quizzes.data ?? []) as AdminQuizRow[],
      scenarios: (scenarios.data ?? []) as AdminScenarioRow[],
    };

  });

export const adminPracticeQuery = (contentId: string, enabled: boolean) =>
  queryOptions({
    queryKey: ["admin", "practice", contentId],
    queryFn: () => adminListPractice({ data: { contentId } }),
    enabled: enabled && Boolean(contentId),
  });

export const adminSaveQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      id?: string | undefined;
      content_id: string;
      question_type: string;
      prompt: string;
      options: { id: string; text: string }[];
      correct_answer: Json;
      explanation: string;
      difficulty: Difficulty;
      status: ContentStatus;
      sort_order: number;
    }) => data,
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context as Ctx);
    const { id, ...fields } = data;
    const db = context.supabase as any;
    if (id) {
      const { error } = await db.from("practice_questions").update(fields).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: row, error } = await db
      .from("practice_questions")
      .insert(fields)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

export const adminSaveQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      id?: string | undefined;
      content_id: string;
      title: string;
      description: string | null;
      question_ids: string[];
      status: ContentStatus;
    }) => data,
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context as Ctx);
    const { id, ...fields } = data;
    const db = context.supabase as any;
    if (id) {
      const { error } = await db.from("quizzes").update(fields).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: row, error } = await db.from("quizzes").insert(fields).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

export const adminSaveScenario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      id?: string | undefined;
      content_id: string;
      kind: string;
      title: string;
      setup: string;
      symptoms: string[];
      steps: Json[];
      safety_note: string | null;
      difficulty: Difficulty;
      status: ContentStatus;
    }) => data,
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context as Ctx);
    const { id, ...fields } = data;
    const db = context.supabase as any;
    if (id) {
      const { error } = await db.from("scenarios").update(fields).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: row, error } = await db.from("scenarios").insert(fields).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

export const adminDeletePractice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { table: "practice_questions" | "quizzes" | "scenarios"; id: string }) => data)
  .handler(async ({ data, context }) => {
    await assertStaff(context as Ctx);
    const { error } = await context.supabase.from(data.table).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Users, roles and subscriptions (admin only)                         */
/* ------------------------------------------------------------------ */

export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) {
      return { ok: false, message: "An administrator already exists." };
    }
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: "You are now the site administrator." };
  });

export type AdminUserRow = {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  roles: string[];
  pro: boolean;
};

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const [{ data: roles }, { data: subs }] = await Promise.all([
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin.from("subscriptions").select("user_id, status, current_period_end"),
    ]);

    const now = Date.now();
    return (list?.users ?? []).map((u) => ({
      id: u.id,
      email: u.email ?? null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      roles: (roles ?? []).filter((r) => r.user_id === u.id).map((r) => r.role as string),
      pro: (subs ?? []).some(
        (s) =>
          s.user_id === u.id &&
          (s.status === "active" || s.status === "trialing") &&
          (!s.current_period_end || new Date(s.current_period_end).getTime() > now),
      ),
    })) as AdminUserRow[];
  });

export const adminUsersQuery = (enabled: boolean) =>
  queryOptions({ queryKey: ["admin", "users"], queryFn: () => adminListUsers(), enabled });

export const adminSetRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { userId: string; role: "admin" | "editor"; grant: boolean }) => data,
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx);
    if (data.userId === context.userId && data.role === "admin" && !data.grant) {
      throw new Error("You cannot remove your own administrator role.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.grant) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.userId, role: data.role }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminSetPro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string; grant: boolean; interval?: "monthly" | "annual" }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.grant) {
      const end = new Date();
      end.setFullYear(end.getFullYear() + (data.interval === "annual" ? 1 : 0));
      if (data.interval !== "annual") end.setMonth(end.getMonth() + 1);
      const { error } = await supabaseAdmin.from("subscriptions").insert({
        user_id: data.userId,
        status: "active",
        plan_interval: data.interval ?? "monthly",
        current_period_end: end.toISOString(),
        provider: "manual",
      });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("subscriptions")
        .update({ status: "canceled" })
        .eq("user_id", data.userId)
        .in("status", ["active", "trialing"]);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Symptoms                                                            */
/* ------------------------------------------------------------------ */

export type AdminSymptomRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  severity: string;
  is_published: boolean;
  sort_order: number;
};

export type AdminSymptomLink = {
  content_id: string;
  role: string;
  note: string | null;
  sort_order: number;
};

export const adminListSymptoms = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context as Ctx);
    const db = context.supabase as any;
    const [{ data: rows, error }, { data: links }] = await Promise.all([
      db
        .from("symptoms")
        .select("id, slug, title, description, category, severity, is_published, sort_order")
        .order("category")
        .order("sort_order")
        .order("title"),
      db.from("content_symptoms").select("symptom_id"),
    ]);
    if (error) throw new Error(error.message);
    const counts = new Map<string, number>();
    for (const l of (links ?? []) as { symptom_id: string }[]) {
      counts.set(l.symptom_id, (counts.get(l.symptom_id) ?? 0) + 1);
    }
    return ((rows ?? []) as AdminSymptomRow[]).map((r) => ({
      ...r,
      link_count: counts.get(r.id) ?? 0,
    }));
  });

export const adminSymptomsQuery = (enabled: boolean) =>
  queryOptions({
    queryKey: ["admin", "symptoms"],
    queryFn: () => adminListSymptoms(),
    enabled,
  });

export const adminGetSymptomLinks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { symptomId: string }) => data)
  .handler(async ({ data, context }) => {
    await assertStaff(context as Ctx);
    const { data: rows, error } = await (context.supabase as any)
      .from("content_symptoms")
      .select("content_id, role, note, sort_order")
      .eq("symptom_id", data.symptomId)
      .order("sort_order");
    if (error) throw new Error(error.message);
    return (rows ?? []) as AdminSymptomLink[];
  });

export const adminSymptomLinksQuery = (symptomId: string, enabled: boolean) =>
  queryOptions({
    queryKey: ["admin", "symptom-links", symptomId],
    queryFn: () => adminGetSymptomLinks({ data: { symptomId } }),
    enabled,
  });

export const adminSaveSymptom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      id?: string | undefined;
      slug: string;
      title: string;
      description: string | null;
      category: string | null;
      severity: string;
      is_published: boolean;
      sort_order: number;
      links: AdminSymptomLink[];
    }) => data,
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context as Ctx);
    const db = context.supabase as any;
    const { id, links, ...fields } = data;

    let symptomId = id;
    if (symptomId) {
      const { error } = await db.from("symptoms").update(fields).eq("id", symptomId);
      if (error) throw new Error(error.message);
    } else {
      const { data: row, error } = await db.from("symptoms").insert(fields).select("id").single();
      if (error) throw new Error(error.message);
      symptomId = row.id as string;
    }

    await db.from("content_symptoms").delete().eq("symptom_id", symptomId);
    const clean = links.filter((l) => l.content_id);
    if (clean.length) {
      const { error } = await db.from("content_symptoms").insert(
        clean.map((l, i) => ({
          symptom_id: symptomId,
          content_id: l.content_id,
          role: l.role || "related",
          note: l.note || null,
          sort_order: l.sort_order ?? i,
        })),
      );
      if (error) throw new Error(error.message);
    }
    return { id: symptomId as string };
  });

export const adminDeleteSymptom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx);
    const db = context.supabase as any;
    await db.from("content_symptoms").delete().eq("symptom_id", data.id);
    const { error } = await db.from("symptoms").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Learning paths                                                      */
/* ------------------------------------------------------------------ */

export type AdminPathItem = { content_id: string; note: string | null; sort_order: number };

export const adminListPaths = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context as Ctx);
    const db = context.supabase as any;
    const [{ data: rows, error }, { data: items }] = await Promise.all([
      db
        .from("learning_paths")
        .select("id, slug, title, description, level, is_published, sort_order")
        .order("sort_order"),
      db.from("learning_path_items").select("path_id"),
    ]);
    if (error) throw new Error(error.message);
    const counts = new Map<string, number>();
    for (const i of (items ?? []) as { path_id: string }[]) {
      counts.set(i.path_id, (counts.get(i.path_id) ?? 0) + 1);
    }
    return ((rows ?? []) as {
      id: string;
      slug: string;
      title: string;
      description: string | null;
      level: Difficulty;
      is_published: boolean;
      sort_order: number;
    }[]).map((r) => ({ ...r, step_count: counts.get(r.id) ?? 0 }));
  });

export const adminPathsQuery = (enabled: boolean) =>
  queryOptions({ queryKey: ["admin", "paths"], queryFn: () => adminListPaths(), enabled });

export const adminGetPathItems = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { pathId: string }) => data)
  .handler(async ({ data, context }) => {
    await assertStaff(context as Ctx);
    const { data: rows, error } = await (context.supabase as any)
      .from("learning_path_items")
      .select("content_id, note, sort_order")
      .eq("path_id", data.pathId)
      .order("sort_order");
    if (error) throw new Error(error.message);
    return (rows ?? []) as AdminPathItem[];
  });

export const adminPathItemsQuery = (pathId: string, enabled: boolean) =>
  queryOptions({
    queryKey: ["admin", "path-items", pathId],
    queryFn: () => adminGetPathItems({ data: { pathId } }),
    enabled,
  });

export const adminSavePath = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      id?: string | undefined;
      slug: string;
      title: string;
      description: string | null;
      level: Difficulty;
      is_published: boolean;
      sort_order: number;
      items: AdminPathItem[];
    }) => data,
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context as Ctx);
    const db = context.supabase as any;
    const { id, items, ...fields } = data;

    let pathId = id;
    if (pathId) {
      const { error } = await db.from("learning_paths").update(fields).eq("id", pathId);
      if (error) throw new Error(error.message);
    } else {
      const { data: row, error } = await db
        .from("learning_paths")
        .insert(fields)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      pathId = row.id as string;
    }

    await db.from("learning_path_items").delete().eq("path_id", pathId);
    const clean = items.filter((i) => i.content_id);
    if (clean.length) {
      const { error } = await db.from("learning_path_items").insert(
        clean.map((i, x) => ({
          path_id: pathId,
          content_id: i.content_id,
          note: i.note || null,
          sort_order: x,
        })),
      );
      if (error) throw new Error(error.message);
    }
    return { id: pathId as string };
  });

export const adminDeletePath = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx);
    const db = context.supabase as any;
    await db.from("learning_path_items").delete().eq("path_id", data.id);
    const { error } = await db.from("learning_paths").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Diagnostic trees                                                    */
/* ------------------------------------------------------------------ */

export type AdminTreeNode = {
  key: string;
  is_root: boolean;
  question: string;
  observation: string | null;
  safety_note: string | null;
  possible_causes: string[];
  answers: { label: string; next?: string | null; result?: string | null }[];
  related_content_id: string | null;
  sort_order: number;
};

export const adminListTrees = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context as Ctx);
    const db = context.supabase as any;
    const [{ data: rows, error }, { data: nodes }] = await Promise.all([
      db
        .from("diagnostic_trees")
        .select("id, slug, title, intro, safety_note, status, content_id, symptom_id")
        .order("title"),
      db.from("diagnostic_nodes").select("tree_id"),
    ]);
    if (error) throw new Error(error.message);
    const counts = new Map<string, number>();
    for (const n of (nodes ?? []) as { tree_id: string }[]) {
      counts.set(n.tree_id, (counts.get(n.tree_id) ?? 0) + 1);
    }
    return ((rows ?? []) as {
      id: string;
      slug: string;
      title: string;
      intro: string | null;
      safety_note: string | null;
      status: ContentStatus;
      content_id: string | null;
      symptom_id: string | null;
    }[]).map((r) => ({ ...r, node_count: counts.get(r.id) ?? 0 }));
  });

export const adminTreesQuery = (enabled: boolean) =>
  queryOptions({ queryKey: ["admin", "trees"], queryFn: () => adminListTrees(), enabled });

export const adminGetTreeNodes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { treeId: string }) => data)
  .handler(async ({ data, context }) => {
    await assertStaff(context as Ctx);
    const { data: rows, error } = await (context.supabase as any)
      .from("diagnostic_nodes")
      .select(
        "key, is_root, question, observation, safety_note, possible_causes, answers, related_content_id, sort_order",
      )
      .eq("tree_id", data.treeId)
      .order("sort_order");
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r: any) => ({
      ...r,
      possible_causes: (r.possible_causes ?? []) as string[],
      answers: (r.answers ?? []) as AdminTreeNode["answers"],
    })) as AdminTreeNode[];
  });

export const adminTreeNodesQuery = (treeId: string, enabled: boolean) =>
  queryOptions({
    queryKey: ["admin", "tree-nodes", treeId],
    queryFn: () => adminGetTreeNodes({ data: { treeId } }),
    enabled,
  });

export const adminSaveTree = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      id?: string | undefined;
      slug: string;
      title: string;
      intro: string | null;
      safety_note: string | null;
      status: ContentStatus;
      content_id: string | null;
      symptom_id: string | null;
      nodes: AdminTreeNode[];
    }) => data,
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context as Ctx);
    const db = context.supabase as any;
    const { id, nodes, ...fields } = data;

    let treeId = id;
    if (treeId) {
      const { error } = await db.from("diagnostic_trees").update(fields).eq("id", treeId);
      if (error) throw new Error(error.message);
    } else {
      const { data: row, error } = await db
        .from("diagnostic_trees")
        .insert(fields)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      treeId = row.id as string;
    }

    await db.from("diagnostic_nodes").delete().eq("tree_id", treeId);
    const clean = nodes.filter((n) => n.key && n.question);
    if (clean.length) {
      const { error } = await db.from("diagnostic_nodes").insert(
        clean.map((n, i) => ({
          tree_id: treeId,
          key: n.key,
          is_root: n.is_root,
          question: n.question,
          observation: n.observation || null,
          safety_note: n.safety_note || null,
          possible_causes: n.possible_causes ?? [],
          answers: n.answers ?? [],
          related_content_id: n.related_content_id || null,
          sort_order: n.sort_order ?? i,
        })),
      );
      if (error) throw new Error(error.message);
    }
    return { id: treeId as string };
  });

export const adminDeleteTree = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx);
    const db = context.supabase as any;
    await db.from("diagnostic_nodes").delete().eq("tree_id", data.id);
    const { error } = await db.from("diagnostic_trees").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Level explanations                                                  */
/* ------------------------------------------------------------------ */

export type AdminTopicLevel = { level: Difficulty; summary: string | null; body: Section[] };

export const adminGetTopicLevels = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { contentId: string }) => data)
  .handler(async ({ data, context }) => {
    await assertStaff(context as Ctx);
    const { data: rows, error } = await (context.supabase as any)
      .from("topic_levels")
      .select("level, summary, body")
      .eq("content_id", data.contentId);
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r: any) => ({
      level: r.level as Difficulty,
      summary: (r.summary ?? null) as string | null,
      body: (r.body ?? []) as Section[],
    })) as AdminTopicLevel[];
  });

export const adminTopicLevelsQuery = (contentId: string, enabled: boolean) =>
  queryOptions({
    queryKey: ["admin", "topic-levels", contentId],
    queryFn: () => adminGetTopicLevels({ data: { contentId } }),
    enabled,
  });

export const adminSaveTopicLevels = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { contentId: string; levels: AdminTopicLevel[] }) => data)
  .handler(async ({ data, context }) => {
    await assertStaff(context as Ctx);
    const db = context.supabase as any;
    await db.from("topic_levels").delete().eq("content_id", data.contentId);
    const clean = data.levels.filter((l) => (l.summary ?? "").trim() || l.body.length);
    if (clean.length) {
      const { error } = await db.from("topic_levels").insert(
        clean.map((l) => ({
          content_id: data.contentId,
          level: l.level,
          summary: l.summary || null,
          body: l.body ?? [],
        })),
      );
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
