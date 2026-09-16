import { canonicalUrl, clampDescription, breadcrumbLd, jsonLdScript, SITE_URL } from "./seo";

type TopicLike = {
  topic: {
    title: string;
    summary: string | null;
    updated_at?: string;
    tags?: string[];
  };
} | null;

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

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: url }],
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
