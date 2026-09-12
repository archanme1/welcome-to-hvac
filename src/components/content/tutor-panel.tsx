import { Link } from "@tanstack/react-router";
import { Lock, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { askTutor, type TutorMessage } from "@/lib/tutor.functions";

const QUICK_PROMPTS = [
  "Explain this simply",
  "Give me an example",
  "Go deeper",
  "Quiz me",
  "Give me a troubleshooting scenario",
  "Explain this like an apprentice",
  "Compare two concepts",
  "Help me diagnose this scenario",
];

export function TutorPanel({
  contentId,
  topicTitle,
  topicSummary,
  heading,
}: {
  contentId?: string | undefined;
  topicTitle?: string | undefined;
  topicSummary?: string | undefined;
  heading?: string | undefined;
}) {
  const { user, isPro } = useAuth();
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unlocked = !!user && isPro;
  const title = heading ?? (topicTitle ? `Ask AI about ${topicTitle}` : "Ask the HVAC AI Tutor");

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    const next: TutorMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setError(null);

    const result = await askTutor({ data: { contentId, topicTitle, topicSummary, messages: next } });
    setBusy(false);
    if (result.error || !result.reply) {
      setError(result.error ?? "No answer returned.");
      return;
    }
    setMessages([...next, { role: "assistant", content: result.reply }]);
  };

  return (
    <section id="ai-tutor" className="scroll-mt-24">
      <h2 className="mt-12 flex items-center gap-2 border-b pb-2 text-xl font-semibold tracking-tight sm:text-2xl">
        AI Tutor
        {!unlocked ? <Lock className="h-4 w-4 text-muted-foreground" /> : null}
      </h2>

      {!unlocked ? (
        <div className="mt-5 rounded-lg border bg-card p-5">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4" /> {title}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            The AI Tutor knows the topic you are reading and teaches from the Welcome to HVAC
            knowledge base. Included with HVAC Pro — $5/month or $50/year.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link to="/pricing">See HVAC Pro</Link>
            </Button>
            {!user ? (
              <Button asChild size="sm" variant="outline">
                <Link to="/auth">Sign in</Link>
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-lg border bg-card">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <Sparkles className="h-4 w-4" />
            <p className="text-sm font-medium">{title}</p>
          </div>

          <div className="max-h-[28rem] space-y-4 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ask a question, or start with one of the prompts below.
              </p>
            ) : null}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : ""}>
                <div
                  className={
                    m.role === "user"
                      ? "inline-block max-w-[85%] rounded-lg bg-primary px-3 py-2 text-left text-sm text-primary-foreground"
                      : "whitespace-pre-wrap text-sm leading-7 text-foreground/90"
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}
            {busy ? <p className="text-sm text-muted-foreground">Thinking...</p> : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>

          <div className="border-t px-4 py-3">
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => void send(p)}
                  disabled={busy}
                  className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
                >
                  {p}
                </button>
              ))}
            </div>
            <form
              className="mt-3 flex items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
            >
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about this topic..."
                rows={2}
                className="min-h-[2.75rem] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
              />
              <Button type="submit" size="icon" disabled={busy || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
