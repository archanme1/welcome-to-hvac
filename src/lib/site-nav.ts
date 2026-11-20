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
  /** Sections sharing a group render inside one expandable heading. */
  group?: "Documentation" | "Marketplace";
};

export const SITE_NAV: NavSection[] = [
  { title: "Start Here", href: "/start-here" },
  {
    title: "HVAC Fundamentals",
    href: "/c/hvac-fundamentals",
    categorySlug: "hvac-fundamentals", group: "Documentation",
  },

  { title: "Equipment", href: "/equipment", categorySlug: "equipment", group: "Documentation" },
  { title: "Components", href: "/components", categorySlug: "components", group: "Documentation" },
  { title: "Installation", href: "/c/installation", categorySlug: "installation", group: "Documentation" },
  { title: "Service & Maintenance", href: "/c/service-maintenance", group: "Documentation" },
  { title: "Troubleshooting", href: "/troubleshooting", group: "Documentation" },
  { title: "Symptoms", href: "/symptoms", group: "Documentation" },
  { title: "Tools", href: "/tools", group: "Documentation" },
  { title: "Building Science", href: "/c/building-science", group: "Documentation" },
  { title: "Safety", href: "/c/safety", group: "Documentation" },
  { title: "Learning Paths", href: "/paths", group: "Documentation" },
  { title: "Practice & Mastery", href: "/practice", group: "Documentation" },
  { title: "AI Tutor", href: "/ai-tutor" },
  { title: "Explore", href: "/marketplace", group: "Marketplace" },
  { title: "Post a Listing", href: "/marketplace/new", group: "Marketplace", badge: "Pro" },
  { title: "My Listings", href: "/marketplace/mine", group: "Marketplace", badge: "Pro" },
  { title: "Messages / Inquiries", href: "/marketplace/messages", group: "Marketplace", badge: "Pro" },
  { title: "Shop", href: "/shop" },
  { title: "Engineering Tools & Calculators", href: "/calculators" },
];
