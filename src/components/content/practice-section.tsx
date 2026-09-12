import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Lock, Check, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { practiceQuery, recordProgress, type PracticeQuestion, type Scenario } from "@/lib/practice.functions";
import { cn } from "@/lib/utils";

type Counts = { questions: number; quizzes: number; troubleshooting: number; equipment: number };

export function PracticeSection({
  contentId,
  title,
  counts,
}: {
  contentId: string;
  title: string;
  counts: Counts;
}) {
  const { user, isPro } = useAuth();
  const unlocked = !!user && isPro;
  const { data, isLoading } = useQuery(practiceQuery(contentId, unlocked));

  const total = counts.questions + counts.quizzes + counts.troubleshooting + counts.equipment;
  if (total === 0) return null;

  return (
    <section id="practice" className="scroll-mt-24">
      <h2 className="mt-12 flex items-center gap-2 border-b pb-2 text-xl font-semibold tracking-tight sm:text-2xl">
        Practice &amp; Mastery
        {!unlocked ? <Lock className="h-4 w-4 text-muted-foreground" /> : null}
      </h2>

      {!unlocked ? (
        <LockedPreview title={title} counts={counts} signedIn={!!user} />
      ) : isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading practice...</p>
      ) : (
        <Tabs defaultValue="questions" className="mt-5">
          <TabsList className="flex-wrap">
            {counts.questions > 0 ? <TabsTrigger value="questions">Questions</TabsTrigger> : null}
            {counts.troubleshooting > 0 ? (
              <TabsTrigger value="troubleshooting">Troubleshooting Scenarios</TabsTrigger>
            ) : null}
            {counts.equipment > 0 ? (
              <TabsTrigger value="equipment">Equipment Scenarios</TabsTrigger>
            ) : null}
          </TabsList>

          <TabsContent value="questions" className="mt-4 space-y-4">
            {(data?.questions ?? []).map((q) => (
              <QuestionCard key={q.id} question={q} contentId={contentId} />
            ))}
          </TabsContent>
          <TabsContent value="troubleshooting" className="mt-4 space-y-4">
            {(data?.scenarios ?? [])
              .filter((s) => s.kind === "troubleshooting")
              .map((s) => (
                <ScenarioCard key={s.id} scenario={s} />
              ))}
          </TabsContent>
          <TabsContent value="equipment" className="mt-4 space-y-4">
            {(data?.scenarios ?? [])
              .filter((s) => s.kind === "equipment")
              .map((s) => (
                <ScenarioCard key={s.id} scenario={s} />
              ))}
          </TabsContent>
        </Tabs>
      )}
    </section>
  );
}

function LockedPreview({
  title,
  counts,
  signedIn,
}: {
  title: string;
  counts: Counts;
  signedIn: boolean;
}) {
  const rows = [
    { label: "Questions", value: counts.questions },
    { label: "Quiz", value: counts.quizzes },
    { label: `${title} Troubleshooting Scenarios`, value: counts.troubleshooting },
    { label: `${title} Equipment Scenarios`, value: counts.equipment },
  ].filter((r) => r.value > 0);

  return (
    <div className="mt-5 rounded-lg border bg-card p-5">
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              {row.label}
            </span>
            <span className="text-xs text-muted-foreground">{row.value}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-muted-foreground">
        Practice is part of HVAC Pro — $5/month or $50/year.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link to="/pricing">See HVAC Pro</Link>
        </Button>
        {!signedIn ? (
          <Button asChild size="sm" variant="outline">
            <Link to="/auth">Sign in</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function QuestionCard({ question, contentId }: { question: PracticeQuestion; contentId: string }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const correctId =
    typeof question.correct_answer === "string"
      ? question.correct_answer
      : Array.isArray(question.correct_answer)
        ? String(question.correct_answer[0])
        : null;

  const submit = () => {
    setRevealed(true);
    void recordProgress({
      data: {
        contentId,
        questionId: question.id,
        event: "answered",
        isCorrect: selected === correctId,
      },
    });
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm font-medium">{question.prompt}</p>
      <div className="mt-3 space-y-2">
        {question.options.map((opt) => {
          const isCorrect = revealed && opt.id === correctId;
          const isWrong = revealed && selected === opt.id && opt.id !== correctId;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={revealed}
              onClick={() => setSelected(opt.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors",
                selected === opt.id && !revealed && "border-foreground/40 bg-accent",
                isCorrect && "border-tip-border bg-tip text-tip-foreground",
                isWrong && "border-safety-border bg-safety text-safety-foreground",
                !revealed && "hover:bg-accent/60",
              )}
            >
              {isCorrect ? <Check className="h-4 w-4 shrink-0" /> : null}
              {isWrong ? <X className="h-4 w-4 shrink-0" /> : null}
              <span>{opt.text}</span>
            </button>
          );
        })}
      </div>
      {!revealed ? (
        <Button size="sm" className="mt-3" disabled={!selected} onClick={submit}>
          Check answer
        </Button>
      ) : (
        <div className="mt-3 rounded-md border bg-muted/40 px-3 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Why
          </p>
          <p className="mt-1 text-sm leading-6">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}

function ScenarioCard({ scenario }: { scenario: Scenario }) {
  const [step, setStep] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const current = scenario.steps[step];

  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm font-semibold">{scenario.title}</p>
      <p className="mt-2 text-sm leading-6 text-foreground/85">{scenario.setup}</p>
      {scenario.symptoms.length ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-foreground/85">
          {scenario.symptoms.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      ) : null}

      {current ? (
        <div className="mt-4 border-t pt-4">
          {current.observation ? (
            <p className="mb-2 text-sm text-muted-foreground">{current.observation}</p>
          ) : null}
          <p className="text-sm font-medium">{current.prompt}</p>
          <div className="mt-3 space-y-2">
            {current.options.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setChosen(i)}
                className={cn(
                  "w-full rounded-md border px-3 py-2 text-left text-sm transition-colors hover:bg-accent/60",
                  chosen === i && "border-foreground/40 bg-accent",
                )}
              >
                {opt.text}
              </button>
            ))}
          </div>
          {chosen !== null && current.options[chosen] ? (
            <div className="mt-3 rounded-md border bg-muted/40 px-3 py-2.5">
              <p className="text-sm leading-6">{current.options[chosen]!.feedback}</p>
              {step < scenario.steps.length - 1 ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => {
                    setStep(step + 1);
                    setChosen(null);
                  }}
                >
                  Continue
                </Button>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">End of scenario.</p>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      {scenario.safety_note ? (
        <p className="mt-4 rounded-md border border-safety-border bg-safety px-3 py-2 text-xs leading-5 text-safety-foreground">
          <span className="font-semibold uppercase tracking-wide">Safety — </span>
          {scenario.safety_note}
        </p>
      ) : null}
    </div>
  );
}
