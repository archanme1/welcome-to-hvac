import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Staff-only: ask the AI to draft a fact. The result is saved as a draft for human review. */
export const draftTradeFact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ topic: z.string().min(3).max(200), category: z.string().max(60) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: staff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!staff) throw new Error("Editor or administrator access required.");
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI drafting is unavailable.");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.8-flash",
        messages: [
          { role: "system", content: "You draft short, accurate educational facts for HVAC and skilled-trade learners. Only state well-established technical facts. Never give unsafe advice. Reply with JSON only: {\"headline\": string (max 90 chars, curious but not clickbait), \"explanation\": string (2-3 sentences), \"example\": string (one practical example or surprising detail), \"source_note\": string (what reference a reviewer should check)}." },
          { role: "user", content: `Category: ${data.category}. Topic: ${data.topic}` },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) throw new Error(res.status === 429 ? "AI is busy — try again shortly." : "AI drafting failed.");
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    let parsed: { headline?: string; explanation?: string; example?: string; source_note?: string } = {};
    try { parsed = JSON.parse(json.choices?.[0]?.message?.content ?? "{}"); } catch { /* ignore */ }
    if (!parsed.headline || !parsed.explanation) throw new Error("AI returned an incomplete draft.");

    const { data: row, error } = await context.supabase.from("trade_facts").insert({
      headline: parsed.headline.slice(0, 160), explanation: parsed.explanation.slice(0, 1200),
      example: parsed.example?.slice(0, 600) ?? null, category: data.category,
      source_note: `AI draft — verify before approving. ${parsed.source_note ?? ""}`.slice(0, 500), status: "draft",
    }).select("id").single();
    if (error) throw new Error("Could not save the draft.");
    return { id: row.id };
  });
