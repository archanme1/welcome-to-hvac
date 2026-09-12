import { AppLink } from "@/components/app-link";
import {
  CONTENT_TYPE_PLURAL,
  topicHref,
  type ContentSummary,
  type ContentType,
} from "@/lib/hvac-types";

const GROUP_TITLES: Record<ContentType, string> = {
  equipment: "Related Equipment",
  component: "Related Components",
  concept: "Related Concepts",
  procedure: "Related Procedures",
  tool: "Related Tools",
  troubleshooting: "Related Troubleshooting",
};

const ORDER: ContentType[] = [
  "equipment",
  "component",
  "concept",
  "procedure",
  "troubleshooting",
  "tool",
];

export function RelatedTopics({ related }: { related: Record<ContentType, ContentSummary[]> }) {
  const groups = ORDER.filter((type) => related[type]?.length);
  if (!groups.length) return null;

  return (
    <section id="related-topics" className="scroll-mt-24">
      <h2 className="mt-12 border-b pb-2 text-xl font-semibold tracking-tight sm:text-2xl">
        Related Topics
      </h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {groups.map((type) => (
          <div key={type}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {GROUP_TITLES[type]}
            </p>
            <ul className="mt-2 space-y-1">
              {related[type].map((item) => (
                <li key={item.id}>
                  <AppLink
                    to={topicHref(item.content_type, item.slug)}
                    className="text-sm underline-offset-4 hover:underline"
                  >
                    {item.title}
                  </AppLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TopicCardGrid({ items }: { items: ContentSummary[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <AppLink
          key={item.id}
          to={topicHref(item.content_type, item.slug)}
          className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
        >
          <p className="text-sm font-semibold">{item.title}</p>
          {item.summary ? (
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
              {item.summary}
            </p>
          ) : null}
          <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {CONTENT_TYPE_PLURAL[item.content_type]}
          </p>
        </AppLink>
      ))}
    </div>
  );
}
