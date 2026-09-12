import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type TutorMessage = { role: "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `You are the Welcome to HVAC AI Tutor, an HVAC instructor for students, apprentices and technicians.

Teaching rules:
- Ground every answer in the Welcome to HVAC topic context you are given. If the question goes beyond it, say so plainly and teach the underlying principle.
- Start simple, then go deeper. Define terms before using them.
- Explain WHY, not just what. Diagnostic reasoning matters more than a parts list.
- Never give a single-cause answer to a symptom that has many possible causes. Walk through the possibilities and what would distinguish them.

Safety rules (non-negotiable):
- Never present bypassing, jumpering or defeating a safety control as a repair. You may explain what a control does and why a technician might isolate it during a controlled, momentary diagnostic test under manufacturer procedures — always with the control restored afterwards.
- For gas, combustion, carbon monoxide, refrigerants, high pressure, brazing, nitrogen and live electrical work, emphasise proper training, PPE, lockout/tagout where applicable, manufacturer instructions and recovery/handling regulations.
- Never give instructions that would leave equipment running unsafely.

Code rule:
- You do not know the reader's local code. For anything involving installation, venting, combustion air, gas piping, clearances, terminations, electrical requirements or permits, say: "Requirements vary by jurisdiction and manufacturer. Verify the applicable local code and installation instructions."

Keep answers focused and readable. Use short paragraphs and lists. No markdown headings above level 3.`;

export const askTutor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { topicTitle?: string | undefined; topicSummary?: string | undefined; messages: TutorMessage[] }) => data,
  )
  .handler(async ({ data, context }) => {
    const { data: pro } = await context.supabase.rpc("is_pro", { _user_id: context.userId });
    if (!pro) {
      return { error: "HVAC Pro subscription required.", reply: null as string | null };
    }

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      return { error: "The AI Tutor is not configured yet.", reply: null as string | null };
    }

    const topicContext = data.topicTitle
      ? `Current Welcome to HVAC topic: ${data.topicTitle}.\n${data.topicSummary ?? ""}`
      : "The reader is browsing the Welcome to HVAC knowledge base with no specific topic open.";

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
