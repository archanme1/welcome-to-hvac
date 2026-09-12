import { useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";

import { AppLink } from "@/components/app-link";
import { Callout } from "./callout";
import { Diagram, hasDiagram } from "./diagrams";
import { SectionRenderer } from "./block-renderer";
import { RelatedTopics } from "./related-topics";
import { PracticeSection } from "./practice-section";
import { TutorPanel } from "./tutor-panel";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { recordProgress } from "@/lib/practice.functions";
import { recordTopicView, type TopicPayload } from "@/lib/hvac.functions";
import {
  CONTENT_TYPE_LABEL,
  CONTENT_TYPE_PATH,
  CONTENT_TYPE_PLURAL,
  DIFFICULTY_LABEL,
  SYMPTOM_ROLE_LABEL,
  topicHref,
} from "@/lib/hvac-types";

export function TopicPage({ payload }: { payload: TopicPayload }) {
  const { topic, category, related, practice, symptoms, levels, nextTopic, diagnostic } = payload;
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    void recordProgress({ data: { contentId: topic.id, event: "viewed" } });
  }, [user, topic.id]);

  // Anonymous view counter, used only for "most read" ordering.
  useEffect(() => {
    void recordTopicView({ data: { contentId: topic.id } }).catch(() => {});
  }, [topic.id]);

  const sections = useMemo(() => topic.body.filter((s) => s.blocks?.length), [topic.body]);

  // The header diagram is only shown when the body does not already render it.
  const bodyHasDiagram = useMemo(
    () =>
      sections.some((s) =>
        s.blocks.some((b) => b.type === "diagram" && b.diagram === topic.diagram_key),
      ),
    [sections, topic.diagram_key],
  );

  const showCategoryCrumb =
    !!category && category.title !== CONTENT_TYPE_PLURAL[topic.content_type];

  const toc = [
    ...sections.map((s) => ({ id: s.id, title: s.title })),
    ...(levels.length ? [{ id: "by-level", title: "By Experience Level" }] : []),
    ...(symptoms.length ? [{ id: "symptoms", title: "Symptoms" }] : []),
    ...(Object.values(related).some((v) => v.length)
      ? [{ id: "related-topics", title: "Related Topics" }]
      : []),
    ...(practice.questions + practice.quizzes + practice.troubleshooting + practice.equipment > 0
      ? [{ id: "practice", title: "Practice & Mastery" }]
      : []),
    { id: "ai-tutor", title: "AI Tutor" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl gap-10 px-4 py-8 sm:px-6 lg:py-12">
      <article className="min-w-0 flex-1">
        <nav className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <AppLink to={CONTENT_TYPE_PATH[topic.content_type]} className="hover:text-foreground">
            {CONTENT_TYPE_PLURAL[topic.content_type]}
          </AppLink>
          {showCategoryCrumb && category ? (
            <>
              <span>/</span>
              <AppLink to={`/c/${category.slug}`} className="hover:text-foreground">
                {category.title}
              </AppLink>
            </>
          ) : null}
          <span>/</span>
          <span className="text-foreground">{topic.title}</span>
        </nav>

        <header className="mt-4">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{topic.title}</h1>
          {topic.summary ? (
            <p className="mt-3 text-base leading-7 text-muted-foreground">{topic.summary}</p>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{CONTENT_TYPE_LABEL[topic.content_type]}</Badge>
            <Badge variant="outline">{DIFFICULTY_LABEL[topic.difficulty]}</Badge>
            {topic.tags?.slice(0, 4).map((tag) => (
              <span key={tag} className="text-xs text-muted-foreground">
                #{tag}
              </span>
            ))}
          </div>
        </header>

        {topic.safety_note ? (
          <Callout variant="safety" title="Safety">
            {topic.safety_note}
          </Callout>
        ) : null}

        {hasDiagram(topic.diagram_key) && !bodyHasDiagram ? (
          <div className="mt-8">
            <Diagram diagramKey={topic.diagram_key!} />
          </div>
        ) : null}

        {sections.map((section) => (
          <SectionRenderer key={section.id} section={section} />
        ))}

        {topic.code_notice ? (
          <Callout variant="code-notice" title="Local Code Notice">
            {topic.code_notice}
          </Callout>
        ) : null}

        {levels.length ? (
          <section id="by-level" className="scroll-mt-24">
            <h2 className="mt-12 border-b pb-2 text-xl font-semibold tracking-tight sm:text-2xl">
              By Experience Level
            </h2>
            <div className="mt-5 space-y-4">
              {levels.map((level) => (
                <div key={level.level} className="rounded-lg border bg-card p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {DIFFICULTY_LABEL[level.level]}
                  </p>
                  {level.summary ? (
                    <p className="mt-2 text-sm leading-6">{level.summary}</p>
                  ) : null}
                  {level.body?.map((section) => (
                    <SectionRenderer key={section.id} section={section} />
                  ))}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {symptoms.length ? (
          <section id="symptoms" className="scroll-mt-24">
            <h2 className="mt-12 border-b pb-2 text-xl font-semibold tracking-tight sm:text-2xl">
              Symptoms
            </h2>
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {symptoms.map((symptom) => (
                <li key={symptom.id}>
                  <AppLink
                    to={`/symptoms/${symptom.slug}`}
                    className="block rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
                  >
                    <p className="text-sm font-medium">{symptom.title}</p>
                    <p className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                      {SYMPTOM_ROLE_LABEL[symptom.role] ?? symptom.role}
                    </p>
                  </AppLink>
                </li>
              ))}
            </ul>
            {diagnostic ? (
              <AppLink
                to={`/diagnostics/${diagnostic.slug}`}
                className="mt-3 block rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
              >
                <p className="text-sm font-semibold">Step-by-step: {diagnostic.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Work through the checks in order rather than guessing.
                </p>
              </AppLink>
            ) : null}
          </section>
        ) : null}

        <RelatedTopics related={related} />

        <PracticeSection contentId={topic.id} title={topic.title} counts={practice} />

        <TutorPanel contentId={topic.id} topicTitle={topic.title} />

        {nextTopic ? (
          <AppLink
            to={topicHref(nextTopic.content_type, nextTopic.slug)}
            className="mt-12 flex items-center justify-between gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
          >
            <span className="min-w-0">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Next topic
              </span>
              <span className="mt-0.5 block truncate text-sm font-semibold">
                {nextTopic.title}
              </span>
            </span>
            <span aria-hidden className="text-muted-foreground">
              →
            </span>
          </AppLink>
        ) : null}

        <footer className="mt-12 border-t pt-6 text-xs text-muted-foreground">
          <p>
            Educational reference only. Verify procedures against manufacturer instructions and
            local code. Last updated {new Date(topic.updated_at).toLocaleDateString()}.
          </p>
          <p className="mt-2">
            <Link to="/experts" className="underline underline-offset-4">
              Need a human expert?
            </Link>{" "}
            Expert Help is coming soon.
          </p>
        </footer>
      </article>

      <aside className="hidden w-56 shrink-0 xl:block">
        <div className="sticky top-20">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            On this page
          </p>
          <ul className="mt-3 space-y-2 border-l">
            {toc.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="-ml-px block border-l border-transparent pl-3 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
