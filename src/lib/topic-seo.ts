import {
  breadcrumbLd,
  canonicalUrl,
  clampDescription,
  itemListLd,
  jsonLdScript,
  pageMeta,
  SITE_URL,
} from "./seo";
import { topicHref, type ContentSummary } from "./hvac-types";

type TopicLike = {
  topic: {
    title: string;
    summary: string | null;
    updated_at?: string;
    tags?: string[];
  };
} | null | undefined;

/** Shared head() for the six topic detail routes: metadata, canonical, Article + breadcrumbs. */
export function topicHead(options: {
  /** URL segment, e.g. "equipment". */
  segment: string;
  /** Human label for breadcrumbs, e.g. "Equipment". */
  sectionLabel: string;
  slug: string;
  fallbackDescription: string;
  loaderData: TopicLike;
}) {
  const { segment, sectionLabel, slug, fallbackDescription, loaderData } = options;

  if (!loaderData) {
    return {
      meta: [
        { title: "Unavailable — Welcome to HVAC" },
        { name: "robots", content: "noindex" },
      ],
    };
  }

  const path = `/${segment}/${slug}`;
  const url = canonicalUrl(path);
  const title = `${loaderData.topic.title} — Welcome to HVAC`;
  const description = clampDescription(loaderData.topic.summary ?? fallbackDescription);
  const base = pageMeta({ title, description, path, type: "article" });

  return {
    ...base,
    scripts: [
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "TechArticle",
        headline: loaderData.topic.title,
        description,
        mainEntityOfPage: url,
        url,
        inLanguage: "en",
        ...(loaderData.topic.updated_at ? { dateModified: loaderData.topic.updated_at } : {}),
        ...(loaderData.topic.tags?.length ? { keywords: loaderData.topic.tags.join(", ") } : {}),
        author: { "@type": "Organization", name: "Welcome to HVAC", url: SITE_URL },
        publisher: { "@type": "Organization", name: "Welcome to HVAC", url: SITE_URL },
      }),
      jsonLdScript(
        breadcrumbLd([
          { name: "Home", path: "/" },
          { name: sectionLabel, path: `/${segment}` },
          { name: loaderData.topic.title, path },
        ]),
      ),
    ],
  };
}

/** Metadata and content-derived structured data for the six documentation indexes. */
export function topicIndexHead(options: {
  segment: string;
  sectionLabel: string;
  title: string;
  description: string;
  loaderData?: { topics: ContentSummary[] } | undefined;
}) {
  const { segment, sectionLabel, title, description, loaderData } = options;
  const path = `/${segment}`;
  const base = pageMeta({ title, description, path });
  const topics = loaderData?.topics ?? [];

  return {
    ...base,
    scripts: [
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: title,
        description,
        url: canonicalUrl(path),
        inLanguage: "en",
        isPartOf: { "@id": `${SITE_URL}/#website` },
      }),
      ...(topics.length
        ? [
            jsonLdScript(
              itemListLd(
                sectionLabel,
                topics.map((topic) => ({
                  name: topic.title,
                  path: topicHref(topic.content_type, topic.slug),
                })),
              ),
            ),
          ]
        : []),
      jsonLdScript(
        breadcrumbLd([
          { name: "Home", path: "/" },
          { name: sectionLabel, path },
        ]),
      ),
    ],
  };
}
