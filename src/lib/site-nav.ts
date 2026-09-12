import type { ContentType } from "./hvac-types";

export type NavLeaf = { title: string; href: string };

export type NavSection = {
  title: string;
  href: string;
  /** Pull child links from the sub-categories of this category slug. */
  categorySlug?: string;
  /** Pull child links from the topics of this content type inside the category. */
  topicType?: ContentType;
  badge?: string;
  staticChildren?: NavLeaf[];
};

export const SITE_NAV: NavSection[] = [
  { title: "Start Here", href: "/start-here" },
  {
    title: "HVAC Fundamentals",
    href: "/c/hvac-fundamentals",
    categorySlug: "hvac-fundamentals",
  },

  { title: "Equipment", href: "/equipment", categorySlug: "equipment" },
  { title: "Components", href: "/components", categorySlug: "components" },
  { title: "Installation", href: "/c/installation", categorySlug: "installation" },
  { title: "Service & Maintenance", href: "/c/service-maintenance" },
  { title: "Troubleshooting", href: "/troubleshooting" },
  { title: "Tools", href: "/tools" },
  { title: "Building Science", href: "/c/building-science" },
  { title: "Safety", href: "/c/safety" },
  { title: "Practice & Mastery", href: "/practice" },
  { title: "AI Tutor", href: "/ai-tutor" },
  { title: "Search", href: "/search" },
  { title: "Experts", href: "/experts", badge: "Soon" },
];
