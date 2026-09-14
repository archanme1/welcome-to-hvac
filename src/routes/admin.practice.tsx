import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import {
  adminContentListQuery,
  adminDeletePractice,
  adminPracticeQuery,
  adminSaveQuestion,
  adminSaveQuiz,
  adminSaveScenario,
} from "@/lib/admin.functions";
import type { Json } from "@/lib/admin.functions";
import type { ContentStatus, Difficulty } from "@/lib/hvac-types";

export const Route = createFileRoute("/admin/practice")({ component: Practice });

const QUESTION_TYPES = [
  "multiple_choice",
  "true_false",
  "multiple_select",
  "short_answer",
  "calculation",
  "diagnostic_decision",
  "identify_component",
  "identify_problem",
  "sequence_of_operation",
];
const DIFFICULTIES: Difficulty[] = ["beginner", "apprentice", "technician", "advanced"];

type QuestionDraft = {
  id?: string;
  question_type: string;
  prompt: string;
  options: { id: string; text: string }[];
  correct_answer: string;
  explanation: string;
  difficulty: Difficulty;
  status: ContentStatus;
  sort_order: number;
};

const emptyQuestion: QuestionDraft = {
  question_type: "multiple_choice",
  prompt: "",
  options: [
    { id: "a", text: "" },
    { id: "b", text: "" },
  ],
  correct_answer: "a",
  explanation: "",
  difficulty: "apprentice",
  status: "published",
  sort_order: 0,
};

function parseAnswer(raw: string): Json {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as Json;
  } catch {
    return trimmed;
  }
}

function Practice() {
  const { isStaff } = useAuth();
  const qc = useQueryClient();
  const { data: topics } = useQuery(adminContentListQuery({}, isStaff));
  const [contentId, setContentId] = useState("");
  const { data: practice } = useQuery(adminPracticeQuery(contentId, isStaff));
  const [question, setQuestion] = useState<QuestionDraft>(emptyQuestion);
  const [quiz, setQuiz] = useState<{ id?: string; title: string; description: string; question_ids: string[] }>(
    { title: "", description: "", question_ids: [] },
  );
  const [scenario, setScenario] = useState({
    id: undefined as string | undefined,
    kind: "troubleshooting",
    title: "",
    setup: "",
    symptoms: "",
    steps: "[]",
    complaint: "",
    readings: "",
    error_codes: "",
    possible_causes: "",
    resolution: "",
    safety_note: "",
    difficulty: "technician" as Difficulty,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "practice", contentId] });

  const guard = async (fn: () => Promise<unknown>, message: string) => {
    if (!contentId) {
      toast.error("Choose a topic first.");
      return;
    }
    try {
      await fn();
      toast.success(message);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save.");
    }
  };

  const del = (table: "practice_questions" | "quizzes" | "scenarios", id: string) =>
    guard(() => adminDeletePractice({ data: { table, id } }), "Deleted.");

  return (
    <div className="space-y-6">
      <div className="max-w-md">
        <Label className="text-xs">Topic</Label>
        <Select value={contentId} onValueChange={setContentId}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a topic" />
          </SelectTrigger>
          <SelectContent>
            {(topics ?? []).map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!contentId ? (
        <p className="text-sm text-muted-foreground">
          Pick a topic to manage its questions, quizzes and scenarios.
        </p>
      ) : (
        <Tabs defaultValue="questions">
          <TabsList>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
            <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          </TabsList>

          <TabsContent value="questions" className="mt-4 grid gap-6 lg:grid-cols-[1fr_380px]">
            <ul className="divide-y divide-border rounded-lg border border-border">
              {(practice?.questions ?? []).map((q) => (
                <li key={q.id} className="flex flex-wrap items-start gap-2 px-4 py-3 text-sm">
                  <div>
                    <div className="font-medium">{q.prompt}</div>
                    <div className="text-xs text-muted-foreground">
                      {q.question_type} · {q.difficulty} · {q.status}
                    </div>
                  </div>
                  <div className="ml-auto flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setQuestion({
                          id: q.id,
                          question_type: q.question_type,
                          prompt: q.prompt,
                          options: (q.options ?? []) as unknown as { id: string; text: string }[],
                          correct_answer: JSON.stringify(q.correct_answer ?? ""),
                          explanation: q.explanation ?? "",
                          difficulty: q.difficulty,
                          status: q.status,
                          sort_order: q.sort_order,
                        })
                      }
                    >
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => del("practice_questions", q.id)}>
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
              {!(practice?.questions ?? []).length ? (
                <li className="px-4 py-6 text-sm text-muted-foreground">No questions yet.</li>
              ) : null}
            </ul>

            <div className="space-y-3 rounded-lg border border-border bg-card p-4">
              <h2 className="text-sm font-semibold">{question.id ? "Edit question" : "New question"}</h2>
              <div>
                <Label className="text-xs">Prompt</Label>
                <Textarea
                  rows={3}
                  value={question.prompt}
                  onChange={(e) => setQuestion({ ...question, prompt: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Type</Label>
                  <Select
                    value={question.question_type}
                    onValueChange={(v) => setQuestion({ ...question, question_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {QUESTION_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Level</Label>
                  <Select
                    value={question.difficulty}
                    onValueChange={(v) => setQuestion({ ...question, difficulty: v as Difficulty })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTIES.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Options</Label>
                {question.options.map((o, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      className="w-16"
                      value={o.id}
                      onChange={(e) => {
                        const next = [...question.options];
                        next[i] = { ...o, id: e.target.value };
                        setQuestion({ ...question, options: next });
                      }}
                    />
                    <Input
                      value={o.text}
                      onChange={(e) => {
                        const next = [...question.options];
                        next[i] = { ...o, text: e.target.value };
                        setQuestion({ ...question, options: next });
                      }}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setQuestion({
                          ...question,
                          options: question.options.filter((_, x) => x !== i),
                        })
                      }
                    >
                      ×
                    </Button>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setQuestion({
                      ...question,
                      options: [...question.options, { id: "", text: "" }],
                    })
                  }
                >
                  Add option
                </Button>
              </div>
              <div>
                <Label className="text-xs">Correct answer</Label>
                <Input
                  value={question.correct_answer}
                  onChange={(e) => setQuestion({ ...question, correct_answer: e.target.value })}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  One option id, or a list like ["a","c"] for multi-select and sequences.
                </p>
              </div>
              <div>
                <Label className="text-xs">Explanation</Label>
                <Textarea
                  rows={3}
                  value={question.explanation}
                  onChange={(e) => setQuestion({ ...question, explanation: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() =>
                    guard(async () => {
                      await adminSaveQuestion({
                        data: {
                          id: question.id,
                          content_id: contentId,
                          question_type: question.question_type,
                          prompt: question.prompt,
                          options: question.options,
                          correct_answer: parseAnswer(question.correct_answer),
                          explanation: question.explanation,
                          difficulty: question.difficulty,
                          status: question.status,
                          sort_order: question.sort_order,
                        },
                      });
                      setQuestion(emptyQuestion);
                    }, "Question saved.")
                  }
                >
                  Save question
                </Button>
                {question.id ? (
                  <Button size="sm" variant="ghost" onClick={() => setQuestion(emptyQuestion)}>
                    Cancel
                  </Button>
                ) : null}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="quizzes" className="mt-4 grid gap-6 lg:grid-cols-[1fr_380px]">
            <ul className="divide-y divide-border rounded-lg border border-border">
              {(practice?.quizzes ?? []).map((z) => (
                <li key={z.id} className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm">
                  <span className="font-medium">{z.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {(z.question_ids ?? []).length} questions · {z.status}
                  </span>
                  <div className="ml-auto flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setQuiz({
                          id: z.id,
                          title: z.title,
                          description: z.description ?? "",
                          question_ids: z.question_ids ?? [],
                        })
                      }
                    >
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => del("quizzes", z.id)}>
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
              {!(practice?.quizzes ?? []).length ? (
                <li className="px-4 py-6 text-sm text-muted-foreground">No quizzes yet.</li>
              ) : null}
            </ul>

            <div className="space-y-3 rounded-lg border border-border bg-card p-4">
              <h2 className="text-sm font-semibold">{quiz.id ? "Edit quiz" : "New quiz"}</h2>
              <div>
                <Label className="text-xs">Title</Label>
                <Input value={quiz.title} onChange={(e) => setQuiz({ ...quiz, title: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Textarea
                  rows={2}
                  value={quiz.description}
                  onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Questions</Label>
                {(practice?.questions ?? []).map((q) => (
                  <label key={q.id} className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={quiz.question_ids.includes(q.id)}
                      onChange={(e) =>
                        setQuiz({
                          ...quiz,
                          question_ids: e.target.checked
                            ? [...quiz.question_ids, q.id]
                            : quiz.question_ids.filter((x) => x !== q.id),
                        })
                      }
                    />
                    <span>{q.prompt}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() =>
                    guard(async () => {
                      await adminSaveQuiz({
                        data: {
                          id: quiz.id,
                          content_id: contentId,
                          title: quiz.title,
                          description: quiz.description || null,
                          question_ids: quiz.question_ids,
                          status: "published",
                        },
                      });
                      setQuiz({ title: "", description: "", question_ids: [] });
                    }, "Quiz saved.")
                  }
                >
                  Save quiz
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="scenarios" className="mt-4 grid gap-6 lg:grid-cols-[1fr_380px]">
            <ul className="divide-y divide-border rounded-lg border border-border">
              {(practice?.scenarios ?? []).map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm">
                  <span className="font-medium">{s.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {s.kind} · {s.status}
                  </span>
                  <div className="ml-auto flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setScenario({
                          id: s.id,
                          kind: s.kind,
                          title: s.title,
                          setup: s.setup ?? "",
                          symptoms: ((s.symptoms ?? []) as unknown as string[]).join("\n"),
                          steps: JSON.stringify(s.steps ?? [], null, 2),
                          safety_note: s.safety_note ?? "",
                          difficulty: s.difficulty,
                        })
                      }
                    >
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => del("scenarios", s.id)}>
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
              {!(practice?.scenarios ?? []).length ? (
                <li className="px-4 py-6 text-sm text-muted-foreground">No scenarios yet.</li>
              ) : null}
            </ul>

            <div className="space-y-3 rounded-lg border border-border bg-card p-4">
              <h2 className="text-sm font-semibold">
                {scenario.id ? "Edit scenario" : "New scenario"}
              </h2>
              <div>
                <Label className="text-xs">Title</Label>
                <Input
                  value={scenario.title}
                  onChange={(e) => setScenario({ ...scenario, title: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Kind</Label>
                <Select
                  value={scenario.kind}
                  onValueChange={(v) => setScenario({ ...scenario, kind: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="troubleshooting">troubleshooting</SelectItem>
                    <SelectItem value="equipment">equipment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Setup</Label>
                <Textarea
                  rows={3}
                  value={scenario.setup}
                  onChange={(e) => setScenario({ ...scenario, setup: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Symptoms (one per line)</Label>
                <Textarea
                  rows={3}
                  value={scenario.symptoms}
                  onChange={(e) => setScenario({ ...scenario, symptoms: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Steps (JSON)</Label>
                <Textarea
                  rows={8}
                  className="font-mono text-xs"
                  value={scenario.steps}
                  onChange={(e) => setScenario({ ...scenario, steps: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Safety note</Label>
                <Textarea
                  rows={2}
                  value={scenario.safety_note}
                  onChange={(e) => setScenario({ ...scenario, safety_note: e.target.value })}
                />
              </div>
              <Button
                size="sm"
                onClick={() =>
                  guard(async () => {
                    let steps: Json[];
                    try {
                      steps = JSON.parse(scenario.steps) as Json[];
                    } catch {
                      throw new Error("The steps field must be valid JSON.");
                    }
                    await adminSaveScenario({
                      data: {
                        id: scenario.id,
                        content_id: contentId,
                        kind: scenario.kind,
                        title: scenario.title,
                        setup: scenario.setup,
                        symptoms: scenario.symptoms.split("\n").map((s) => s.trim()).filter(Boolean),
                        steps,
                        safety_note: scenario.safety_note || null,
                        difficulty: scenario.difficulty,
                        status: "published",
                      },
                    });
                    setScenario({
                      id: undefined,
                      kind: "troubleshooting",
                      title: "",
                      setup: "",
                      symptoms: "",
                      steps: "[]",
                      safety_note: "",
                      difficulty: "technician",
                    });
                  }, "Scenario saved.")
                }
              >
                Save scenario
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
