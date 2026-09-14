import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Section } from "./hvac-types";

export type TutorMessage = { role: "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `You are the Welcome to HVAC AI Tutor, an HVAC instructor for students, apprentices and technicians.

Teaching rules:
- Ground every answer in the Welcome to HVAC topic context you are given. If the question goes beyond it, say so plainly and teach the underlying principle.
- Start simple, then go deeper. Define terms before using them.
- Explain WHY, not just what. Diagnostic reasoning matters more than a parts list.
- Never give a single-cause answer to a symptom that has many possible causes. Walk through the possibilities and what would distinguish them.
- When the reader asks to be quizzed or given a scenario, ask ONE question at a time and wait for their answer before continuing.

Safety rules (non-negotiable):
- Never present bypassing, jumpering or defeating a safety control as a repair. You may explain what a control does and why a technician might isolate it during a controlled, momentary diagnostic test under manufacturer procedures — always with the control restored afterwards.
- For gas, combustion, carbon monoxide, refrigerants, high pressure, brazing, nitrogen and live electrical work, emphasise proper training, PPE, lockout/tagout where applicable, manufacturer instructions and recovery/handling regulations.
- Never give instructions that would leave equipment running unsafely.

Code rule:
- You do not know the reader's local code. For anything involving installation, venting, combustion air, gas piping, clearances, terminations, electrical requirements or permits, say: "Requirements vary by jurisdiction and manufacturer. Verify the applicable local code and installation instructions."

Keep answers focused and readable. Use short paragraphs and lists. No markdown headings above level 3.`;

/** Condense structured body JSON into plain text the model can ground on. */
function bodyToText(body: Section[], maxChars: number): string {
  const parts: string[] = [];
  for (const section of body) {
    parts.push(`## ${section.title}`);
    for (const block of section.blocks) {
      switch (block.type) {
        case "heading":
        case "subheading":
          parts.push(`### ${block.text}`);
          break;
        case "paragraph":
        case "symptom":
          parts.push(block.text);
          break;
        case "list":
        case "steps":
          for (const item of block.items) parts.push(`- ${item}`);
          break;
        case "table":
          parts.push(`${block.headers.join(" | ")}`);
          for (const row of block.rows) parts.push(row.join(" | "));
          break;
        case "definition":
          parts.push(`${block.term}: ${block.text}`);
          break;
        case "formula":
          parts.push(`${block.expression}${block.text ? ` — ${block.text}` : ""}`);
          break;
        case "callout":
          parts.push(`[${block.variant.toUpperCase()}] ${block.title ? `${block.title}: ` : ""}${block.text}`);
          break;
        case "checks":
          for (const c of block.items) parts.push(`- Check: ${c.check} → ${c.meaning}`);
          break;
        case "diagram":
          parts.push(`[Diagram: ${block.diagram}]`);
          break;
        case "image":
          parts.push(`[Image: ${block.alt}]`);
          break;
      }
    }
  }
  const full = parts.join("\n");
  return full.length > maxChars ? `${full.slice(0, maxChars)}\n[...topic continues]` : full;
}

export const askTutor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      contentId?: string | undefined;
      topicTitle?: string | undefined;
      topicSummary?: string | undefined;
      messages: TutorMessage[];
    }) => data,
  )
  .handler(async ({ data, context }) => {
    const { data: pro } = await context.supabase.rpc("is_pro", { _user_id: context.userId });
    if (!pro) {
      return { error: "HVAC Pro subscription required.", reply: null as string | null };
    }

    // Daily usage limit, configured by an administrator. Enforced server-side.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: allowance, error: allowanceError } = await (supabaseAdmin as any).rpc(
      "ai_tutor_consume",
      { _user_id: context.userId },
    );
    const quota = Array.isArray(allowance) ? allowance[0] : allowance;
    if (!allowanceError && quota && quota.allowed === false) {
      return {
        error: `You have reached your daily AI Tutor limit of ${quota.daily_limit} question${
          quota.daily_limit === 1 ? "" : "s"
        }. It resets tomorrow.`,
        reply: null as string | null,
      };
    }

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      return { error: "The AI Tutor is not configured yet.", reply: null as string | null };
    }

    // Ground the tutor in the actual knowledge base, fetched server-side.
    let topicContext =
      "The reader is browsing the Welcome to HVAC knowledge base with no specific topic open.";
    if (data.contentId) {
      const { data: topic } = await context.supabase
        .from("content")
        .select("title, summary, body, safety_note, code_notice, difficulty, content_type")
        .eq("id", data.contentId)
        .eq("status", "published")
        .maybeSingle();
      if (topic) {
        const { data: related } = await context.supabase
          .from("content_relationships")
          .select("related_content_id, content!content_relationships_related_content_id_fkey(title, status)")
          .eq("content_id", data.contentId)
          .limit(12);
        const relatedTitles = (related ?? [])
          .map((r) => (r.content as { title: string; status: string } | null))
          .filter((c) => c && c.status === "published")
          .map((c) => c!.title);

        topicContext = [
          `Current Welcome to HVAC topic: ${topic.title} (${topic.content_type}, ${topic.difficulty} level).`,
          topic.summary ?? "",
          topic.safety_note ? `Safety note on this topic: ${topic.safety_note}` : "",
          topic.code_notice ? `Code notice on this topic: ${topic.code_notice}` : "",
          relatedTitles.length
            ? `Related topics in the knowledge base: ${relatedTitles.join(", ")}.`
            : "",
          "Topic content to ground your answer:",
          bodyToText((topic.body ?? []) as Section[], 6000),
        ]
          .filter(Boolean)
          .join("\n");
      }
    } else if (data.topicTitle) {
      topicContext = `Current Welcome to HVAC topic: ${data.topicTitle}.\n${data.topicSummary ?? ""}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.8-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "system", content: topicContext },
          ...data.messages.slice(-12),
        ],
      }),
    });

    if (response.status === 429) {
      return { error: "The tutor is busy right now. Try again in a moment.", reply: null };
    }
    if (!response.ok) {
      console.error("AI tutor error", response.status, await response.text());
      return { error: "The tutor could not answer that. Please try again.", reply: null };
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return {
      error: null as string | null,
      reply: payload.choices?.[0]?.message?.content ?? null,
    };
  });
