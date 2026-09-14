import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Lock, Check, X, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import {
  practiceQuery,
  recordProgress,
  type PracticeQuestion,
  type Scenario,
} from "@/lib/practice.functions";
import { cn } from "@/lib/utils";

type Counts = { questions: number; quizzes: number; troubleshooting: number; equipment: number };

const TRUE_FALSE_OPTIONS = [
  { id: "true", text: "True" },
  { id: "false", text: "False" },
];

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9.]+/g, " ").replace(/\s+/g, " ").trim();
}

function answerList(answer: PracticeQuestion["correct_answer"]): string[] {
  if (Array.isArray(answer)) return answer.map(String);
  if (typeof answer === "string") return [answer];
  return [];
}

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

  const defaultTab =
    counts.questions > 0
      ? "questions"
      : counts.quizzes > 0
        ? "quiz"
        : counts.troubleshooting > 0
          ? "troubleshooting"
          : "equipment";

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
        <Tabs defaultValue={defaultTab} className="mt-5">
          <TabsList className="flex-wrap">
            {counts.questions > 0 ? <TabsTrigger value="questions">Questions</TabsTrigger> : null}
            {counts.quizzes > 0 ? <TabsTrigger value="quiz">Quiz</TabsTrigger> : null}
            {counts.troubleshooting > 0 ? (
              <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
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

          <TabsContent value="quiz" className="mt-4 space-y-6">
            {(data?.quizzes ?? []).map((quiz) => (
              <QuizRunner
                key={quiz.id}
                contentId={contentId}
                title={quiz.title}
                description={quiz.description}
                questions={(quiz.question_ids ?? [])
                  .map((id: string) => (data?.questions ?? []).find((q) => q.id === id))
                  .filter((q): q is PracticeQuestion => !!q)}
              />
            ))}
          </TabsContent>

          <TabsContent value="troubleshooting" className="mt-4 space-y-4">
            {(data?.scenarios ?? [])
              .filter((s) => s.kind === "troubleshooting")
              .map((s) => (
                <ScenarioCard key={s.id} scenario={s} contentId={contentId} />
              ))}
          </TabsContent>
          <TabsContent value="equipment" className="mt-4 space-y-4">
            {(data?.scenarios ?? [])
              .filter((s) => s.kind === "equipment")
              .map((s) => (
                <ScenarioCard key={s.id} scenario={s} contentId={contentId} />
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

export function QuestionCard({
  question,
  contentId,
  onAnswered,
  compact,
}: {
  question: PracticeQuestion;
  contentId: string;
  onAnswered?: (correct: boolean) => void;
  compact?: boolean;
}) {
  const type = question.question_type;
  const isText = type === "short_answer" || type === "calculation";
  const isMulti = type === "multiple_select";
  const isSequence = type === "sequence_of_operation";

  const options = useMemo(() => {
    if (question.options?.length) return question.options;
    if (type === "true_false") return TRUE_FALSE_OPTIONS;
    return [];
  }, [question.options, type]);

  const correct = answerList(question.correct_answer);

  const [selected, setSelected] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [revealed, setRevealed] = useState(false);

  const ready = isText ? text.trim().length > 0 : isSequence ? selected.length === options.length : selected.length > 0;

  const isRight = () => {
    if (isText) return correct.some((c) => normalize(c) === normalize(text));
    if (isSequence) return selected.join("|") === correct.join("|");
    if (isMulti)
      return (
        selected.length === correct.length && correct.every((c) => selected.includes(c))
      );
    return selected[0] === correct[0];
  };

  const submit = () => {
    const result = isRight();
    setRevealed(true);
    onAnswered?.(result);
    void recordProgress({
      data: { contentId, questionId: question.id, event: "answered", isCorrect: result },
    });
  };

  const toggle = (id: string) => {
    if (revealed) return;
    if (isSequence) {
      setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
      return;
    }
    if (isMulti) {
      setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
      return;
    }
    setSelected([id]);
  };

  const reset = () => {
    setSelected([]);
    setText("");
    setRevealed(false);
  };

  return (
    <div className={cn("rounded-lg border bg-card p-4", compact && "border-0 p-0")}>
      <p className="text-sm font-medium">{question.prompt}</p>
      {isSequence ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Tap the steps in the order they happen.
        </p>
      ) : isMulti ? (
        <p className="mt-1 text-xs text-muted-foreground">Select every answer that applies.</p>
      ) : null}

      {isText ? (
        <div className="mt-3">
          <Input
            value={text}
            disabled={revealed}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your answer"
            aria-label="Your answer"
          />
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {options.map((opt) => {
            const picked = selected.includes(opt.id);
            const order = isSequence ? selected.indexOf(opt.id) + 1 : 0;
            const good = revealed && correct.includes(opt.id) && !isSequence;
            const bad = revealed && picked && !correct.includes(opt.id) && !isSequence;
            return (
              <button
                key={opt.id}
                type="button"
                disabled={revealed}
                onClick={() => toggle(opt.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors",
                  picked && !revealed && "border-foreground/40 bg-accent",
                  good && "border-tip-border bg-tip text-tip-foreground",
                  bad && "border-safety-border bg-safety text-safety-foreground",
                  !revealed && "hover:bg-accent/60",
                )}
              >
                {good ? <Check className="h-4 w-4 shrink-0" /> : null}
                {bad ? <X className="h-4 w-4 shrink-0" /> : null}
                {isSequence && order > 0 ? (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-semibold">
                    {order}
                  </span>
                ) : null}
                <span>{opt.text}</span>
              </button>
            );
          })}
        </div>
      )}

      {!revealed ? (
        <Button size="sm" className="mt-3" disabled={!ready} onClick={submit}>
          Check answer
        </Button>
      ) : (
        <div
          className={cn(
            "mt-3 rounded-md border px-3 py-2.5",
            isRight() ? "border-tip-border bg-tip" : "bg-muted/40",
          )}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {isRight() ? "Correct — why" : "Not quite — why"}
          </p>
          {(isText || isSequence) && correct.length ? (
            <p className="mt-1 text-sm font-medium">
              Answer:{" "}
              {isSequence
                ? correct
                    .map((id) => options.find((o) => o.id === id)?.text ?? id)
                    .join(" → ")
                : correct[0]}
            </p>
          ) : null}
          <p className="mt-1 text-sm leading-6">{question.explanation}</p>
          {!onAnswered ? (
            <Button size="sm" variant="ghost" className="mt-2 h-8 px-2" onClick={reset}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Try again
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}

function QuizRunner({
  contentId,
  title,
  description,
  questions,
}: {
  contentId: string;
  title: string;
  description: string | null;
  questions: PracticeQuestion[];
}) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [done, setDone] = useState(false);
  const [key, setKey] = useState(0);

  if (questions.length === 0) return null;
  const question = questions[Math.min(index, questions.length - 1)]!;

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="rounded-lg border bg-card p-5 text-center">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-3 text-3xl font-bold">{pct}%</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {score} of {questions.length} correct
        </p>
        <Button
          size="sm"
          variant="outline"
          className="mt-4"
          onClick={() => {
            setIndex(0);
            setScore(0);
            setAnswered(false);
            setDone(false);
            setKey((k) => k + 1);
          }}
        >
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          Retake quiz
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-baseline justify-between gap-3 border-b pb-3">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          {description ? (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {index + 1} / {questions.length}
        </span>
      </div>
      <div className="pt-4">
        <QuestionCard
          key={`${key}-${question.id}`}
          question={question}
          contentId={contentId}
          compact
          onAnswered={(correct) => {
            setAnswered(true);
            if (correct) setScore((s) => s + 1);
          }}
        />
      </div>
      {answered ? (
        <Button
          size="sm"
          className="mt-4"
          onClick={() => {
            setAnswered(false);
            if (index + 1 >= questions.length) setDone(true);
            else setIndex(index + 1);
          }}
        >
          {index + 1 >= questions.length ? "See results" : "Next question"}
        </Button>
      ) : null}
    </div>
  );
}

function ScenarioCard({ scenario, contentId }: { scenario: Scenario; contentId: string }) {
  const [step, setStep] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [missteps, setMissteps] = useState(0);
  const [finished, setFinished] = useState(false);
  const current = scenario.steps[step];

  const choose = (i: number) => {
    if (chosen !== null) return;
    setChosen(i);
    const opt = current?.options[i];
    if (opt && opt.correct === false) setMissteps((m) => m + 1);
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm font-semibold">{scenario.title}</p>
      <p className="mt-2 text-sm leading-6 text-foreground/85">{scenario.setup}</p>
      {scenario.details?.complaint ? (
        <p className="mt-3 text-sm leading-6 text-foreground/85">
          <span className="font-medium">Customer complaint: </span>
          {scenario.details.complaint}
        </p>
      ) : null}
      {scenario.symptoms.length ? (
        <DetailList label="Symptoms" items={scenario.symptoms} />
      ) : null}
      {scenario.details?.readings?.length ? (
        <DetailList label="Readings" items={scenario.details.readings} />
      ) : null}
      {scenario.details?.error_codes?.length ? (
        <DetailList label="Error codes" items={scenario.details.error_codes} />
      ) : null}
      {scenario.details?.possible_causes?.length ? (
        <DetailList label="Possible causes" items={scenario.details.possible_causes} />
      ) : null}


      {scenario.safety_note ? (
        <p className="mt-4 rounded-md border border-safety-border bg-safety px-3 py-2 text-xs leading-5 text-safety-foreground">
          <span className="font-semibold uppercase tracking-wide">Safety — </span>
          {scenario.safety_note}
        </p>
      ) : null}

      {finished ? (
        <div className="mt-4 border-t pt-4">
          <p className="text-sm font-medium">Scenario complete.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {missteps === 0
              ? "You reached the fault without a wrong turn."
              : `${missteps} step${missteps === 1 ? "" : "s"} went down the wrong path. Re-read the feedback on those choices.`}
          </p>
          {scenario.details?.resolution ? (
            <p className="mt-3 text-sm leading-6 text-foreground/85">
              <span className="font-medium">Resolution: </span>
              {scenario.details.resolution}
            </p>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={() => {
              setStep(0);
              setChosen(null);
              setMissteps(0);
              setFinished(false);
            }}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Run it again
          </Button>
        </div>
      ) : current ? (
        <div className="mt-4 border-t pt-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Step {step + 1} of {scenario.steps.length}
            </span>
          </div>
          {current.observation ? (
            <p className="mb-2 text-sm text-muted-foreground">{current.observation}</p>
          ) : null}
          <p className="text-sm font-medium">{current.prompt}</p>
          <div className="mt-3 space-y-2">
            {current.options.map((opt, i) => {
              const good = chosen !== null && opt.correct === true;
              const bad = chosen === i && opt.correct === false;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={chosen !== null}
                  onClick={() => choose(i)}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors",
                    chosen === i && chosen !== null && "border-foreground/40",
                    good && "border-tip-border bg-tip text-tip-foreground",
                    bad && "border-safety-border bg-safety text-safety-foreground",
                    chosen === null && "hover:bg-accent/60",
                  )}
                >
                  {good ? <Check className="mt-0.5 h-4 w-4 shrink-0" /> : null}
                  {bad ? <X className="mt-0.5 h-4 w-4 shrink-0" /> : null}
                  <span>{opt.text}</span>
                </button>
              );
            })}
          </div>
          {chosen !== null && current.options[chosen] ? (
            <div className="mt-3 rounded-md border bg-muted/40 px-3 py-2.5">
              <p className="text-sm leading-6">{current.options[chosen]!.feedback}</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => {
                  if (step + 1 >= scenario.steps.length) {
                    setFinished(true);
                    void recordProgress({
                      data: { contentId, event: "scenario_completed", isCorrect: missteps === 0 },
                    });
                  } else {
                    setStep(step + 1);
                    setChosen(null);
                  }
                }}
              >
                {step + 1 >= scenario.steps.length ? "Finish" : "Continue"}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
