import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { AppLink } from "@/components/app-link";
import { TopicCardGrid } from "@/components/content/related-topics";
import { categoryQuery } from "@/lib/hvac.functions";

export const Route = createFileRoute("/c/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(categoryQuery(params.slug));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Unavailable — Welcome to HVAC" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `${loaderData.category.title} — Welcome to HVAC`;
    const description =
      loaderData.category.description ?? `HVAC topics in ${loaderData.category.title}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  errorComponent: () => (
    <p className="p-8 text-sm text-muted-foreground">This page didn't load. Please refresh.</p>
  ),
  notFoundComponent: () => (
    <p className="p-8 text-sm text-muted-foreground">This section hasn't been published yet.</p>
  ),
  component: Page,
});

function Page() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(categoryQuery(slug));
  if (!data) return null;
  const { category, children, topics } = data;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{category.title}</h1>
      {category.description ? (
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
          {category.description}
        </p>
      ) : null}

      {children.length ? (
        <div className="mt-8 flex flex-wrap gap-2">
          {children.map((child) => (
            <AppLink
              key={child.id}
              to={`/c/${child.slug}`}
              className="rounded-full border px-3 py-1 text-sm transition-colors hover:bg-accent"
            >
              {child.title}
            </AppLink>
          ))}
        </div>
      ) : null}

      <div className="mt-8">
        {topics.length ? (
          <TopicCardGrid items={topics} />
        ) : (
          <p className="text-sm text-muted-foreground">
            No topics published in this section yet.
          </p>
        )}
      </div>
    </div>
  );
}
