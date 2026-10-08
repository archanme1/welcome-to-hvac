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

    const schema = {
      type: "object", additionalProperties: false,
      required: ["headline", "explanation", "example", "source_note"],
      properties: { headline: { type: "string" }, explanation: { type: "string" }, example: { type: "string" }, source_note: { type: "string" } },
    };
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Lovable-API-Key": apiKey, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        instructions: "You draft short, accurate educational facts for HVAC and skilled-trade learners. Only state well-established technical facts. Never give unsafe advice. headline: max 90 characters, curious but not clickbait. explanation: 2-3 sentences. example: one practical example or surprising detail. source_note: which reference a reviewer should check. Respond as JSON.",
        input: [{ role: "user", content: `Category: ${data.category}. Topic: ${data.topic}` }],
        text: { format: { type: "json_schema", name: "trade_fact", strict: true, schema } },
      }),
    });
    if (!res.ok || !res.body) throw new Error(res.status === 429 ? "AI is busy — try again shortly." : res.status === 402 ? "AI credits are used up." : "AI drafting failed.");
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "", out = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const ev = JSON.parse(payload) as { type?: string; delta?: string };
          if (ev.type === "response.output_text.delta" && ev.delta) out += ev.delta;
        } catch { /* partial */ }
      }
    }
    let parsed: { headline?: string; explanation?: string; example?: string; source_note?: string } = {};
    try { parsed = JSON.parse(out || "{}"); } catch { /* ignore */ }
    if (!parsed.headline || !parsed.explanation) throw new Error("AI returned an incomplete draft.");

    const { data: row, error } = await context.supabase.from("trade_facts").insert({
      headline: parsed.headline.slice(0, 160), explanation: parsed.explanation.slice(0, 1200),
      example: parsed.example?.slice(0, 600) ?? null, category: data.category,
      source_note: `AI draft — verify before approving. ${parsed.source_note ?? ""}`.slice(0, 500), status: "draft",
    }).select("id").single();
    if (error) throw new Error("Could not save the draft.");
    return { id: row.id };
  });
