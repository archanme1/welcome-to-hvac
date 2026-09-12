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
    const db = context.supabase;
    const count = async (table: string, filter?: (q: any) => any) => {
      let q = db.from(table).select("id", { count: "exact", head: true });
      if (filter) q = filter(q);
      const { count: n } = await q;
      return n ?? 0;
    };

    const [published, drafts, archived, categories, questions, quizzes, scenarios] =
      await Promise.all([
        count("content", (q) => q.eq("status", "published")),
        count("content", (q) => q.eq("status", "draft")),
        count("content", (q) => q.eq("status", "archived")),
        count("categories"),
        count("practice_questions"),
        count("quizzes"),
        count("scenarios"),
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
    let q = context.supabase
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
  relationships: AdminRelationship[];
};

export const adminSaveContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: ContentInput) => data)
  .handler(async ({ data, context }) => {
    await assertStaff(context as Ctx);
    const db = context.supabase;
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
    const db = context.supabase;
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

export const adminListPractice = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { contentId: string }) => data)
  .handler(async ({ data, context }) => {
    await assertStaff(context as Ctx);
    const db = context.supabase;
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
      questions: questions.data ?? [],
      quizzes: quizzes.data ?? [],
      scenarios: scenarios.data ?? [],
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
      correct_answer: unknown;
      explanation: string;
      difficulty: Difficulty;
      status: ContentStatus;
      sort_order: number;
    }) => data,
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context as Ctx);
    const { id, ...fields } = data;
    const db = context.supabase;
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
    const db = context.supabase;
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
      steps: unknown[];
      safety_note: string | null;
      difficulty: Difficulty;
      status: ContentStatus;
    }) => data,
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context as Ctx);
    const { id, ...fields } = data;
    const db = context.supabase;
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
