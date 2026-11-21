import { describe, expect, it } from "vitest";

import { pageMeta } from "../seo";
import { topicHead, topicIndexHead } from "../topic-seo";

describe("public SEO metadata", () => {
  it("uses a self-referencing canonical and the same page details for social sharing", () => {
    const result = pageMeta({
      title: "Refrigeration reference",
      description: "Technical refrigeration reference.",
      path: "/concepts/refrigeration-cycle/",
      type: "article",
    });

    expect(result.links).toEqual([
      { rel: "canonical", href: "https://www.welcometohvac.com/concepts/refrigeration-cycle" },
    ]);
    expect(result.meta).toContainEqual({ property: "og:url", content: "https://www.welcometohvac.com/concepts/refrigeration-cycle" });
    expect(result.meta).toContainEqual({ name: "twitter:title", content: "Refrigeration reference" });
    expect(result.meta).toContainEqual({ name: "twitter:description", content: "Technical refrigeration reference." });
    expect(result.meta).toContainEqual({ property: "og:type", content: "article" });
  });

  it("uses the topic modification date only when the content supplies one", () => {
    const base = {
      segment: "concepts",
      sectionLabel: "Concepts",
      slug: "heat-transfer",
      fallbackDescription: "Fallback",
    } as const;
    const topic = { title: "Heat Transfer", summary: "How heat moves.", tags: ["heat"] };

    const dated = topicHead({
      ...base,
      loaderData: { topic: { ...topic, updated_at: "2026-11-01T12:00:00Z" } },
    });
    const undated = topicHead({ ...base, loaderData: { topic } });

    if (!("scripts" in dated) || !("scripts" in undated)) throw new Error("Expected topic schema");
    const datedArticle = dated.scripts[0];
    const undatedArticle = undated.scripts[0];
    if (!datedArticle || !undatedArticle) throw new Error("Expected a TechArticle");
    expect(JSON.parse(datedArticle.children)).toMatchObject({ dateModified: "2026-11-01T12:00:00Z" });
    expect(JSON.parse(undatedArticle.children)).not.toHaveProperty("dateModified");
    expect(JSON.parse(undatedArticle.children)).not.toHaveProperty("datePublished");
  });

  it("builds documentation index links from the published topics supplied by the loader", () => {
    const result = topicIndexHead({
      segment: "equipment",
      sectionLabel: "Equipment",
      title: "Equipment",
      description: "Equipment reference",
      loaderData: {
        topics: [{
          id: "topic-1",
          title: "Gas Furnace",
          slug: "gas-furnace",
          content_type: "equipment",
          summary: "Furnace reference",
          difficulty: "beginner",
          tags: [],
          subcategory: null,
        }],
      },
    });
    const schemas = result.scripts.map((script) => JSON.parse(script.children) as { "@type": string });

    expect(schemas.map((schema) => schema["@type"])).toContain("CollectionPage");
    expect(schemas.map((schema) => schema["@type"])).toContain("ItemList");
    expect(JSON.stringify(schemas)).toContain("https://www.welcometohvac.com/equipment/gas-furnace");
  });
});
