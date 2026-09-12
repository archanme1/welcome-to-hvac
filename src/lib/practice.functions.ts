import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Difficulty } from "./hvac-types";

export type PracticeQuestion = {
  id: string;
  question_type: string;
  prompt: string;
  options: { id: string; text: string }[];
  correct_answer: unknown;
  explanation: string;
  difficulty: Difficulty;
};

export type ScenarioStep = {
  prompt: string;
  options: { text: string; feedback: string; correct?: boolean }[];
  observation?: string;
};

export type Scenario = {
  id: string;
  kind: string;
  title: string;
  setup: string;
  symptoms: string[];
  steps: ScenarioStep[];
  safety_note: string | null;
  difficulty: Difficulty;
};

/** Premium practice material for a topic. RLS restricts this to HVAC Pro members. */
export const getPractice = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { contentId: string }) => data)
  .handler(async ({ data, context }) => {
    const db = context.supabase;
    const [questions, quizzes, scenarios] = await Promise.all([
      db
        .from("practice_questions")
        .select("id, question_type, prompt, options, correct_answer, explanation, difficulty")
        .eq("content_id", data.contentId)
        .eq("status", "published")
        .order("sort_order"),
      db
        .from("quizzes")
        .select("id, title, description, question_ids")
        .eq("content_id", data.contentId)
        .eq("status", "published"),
      db
        .from("scenarios")
        .select("id, kind, title, setup, symptoms, steps, safety_note, difficulty")
        .eq("content_id", data.contentId)
        .eq("status", "published"),
    ]);

    return {
      questions: (questions.data ?? []) as PracticeQuestion[],
      quizzes: quizzes.data ?? [],
      scenarios: (scenarios.data ?? []) as Scenario[],
    };
  });

export const practiceQuery = (contentId: string, enabled: boolean) =>
  queryOptions({
    queryKey: ["hvac", "practice", contentId],
    queryFn: () => getPractice({ data: { contentId } }),
    enabled,
    staleTime: 60 * 1000,
  });

/** Records a learner event (viewed a topic, answered a question). */
export const recordProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      contentId?: string;
      questionId?: string;
      event: string;
      isCorrect?: boolean;
    }) => data,
  )
  .handler(async ({ data, context }) => {
    await context.supabase.from("user_progress").insert({
      user_id: context.userId,
      content_id: data.contentId ?? null,
      question_id: data.questionId ?? null,
      event: data.event,
      is_correct: data.isCorrect ?? null,
    });
    return { ok: true };
  });

/** Learner's own progress summary. */
export const getProgressSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_progress")
      .select("content_id, event, is_correct")
      .eq("user_id", context.userId)
      .limit(5000);

    const rows = data ?? [];
    const topicsViewed = new Set(
      rows.filter((r) => r.event === "viewed" && r.content_id).map((r) => r.content_id),
    ).size;
    const answered = rows.filter((r) => r.event === "answered");
    const correct = answered.filter((r) => r.is_correct).length;

    return {
      topicsViewed,
      questionsAnswered: answered.length,
      correct,
      accuracy: answered.length ? Math.round((correct / answered.length) * 100) : 0,
    };
  });

export const progressQuery = (enabled: boolean) =>
  queryOptions({
    queryKey: ["hvac", "progress"],
    queryFn: () => getProgressSummary(),
    enabled,
    staleTime: 30 * 1000,
  });
