import { useRouterState } from "@tanstack/react-router";
import { AppLink } from "@/components/app-link";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { SITE_NAV } from "@/lib/site-nav";
import { categoryTopicsQuery, navTreeQuery, type NavTreeNode } from "@/lib/hvac.functions";
import { topicHref } from "@/lib/hvac-types";

type Child = { title: string; href: string };

export function SidebarNav({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  // Compact tree: categories and counts only, never the whole library.
  const { data } = useQuery(navTreeQuery);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const sections = useMemo(() => {
    const nodes = (data ?? []) as NavTreeNode[];
    const byParent = new Map<string, NavTreeNode[]>();
    for (const node of nodes) {
      if (!node.parent_id) continue;
      const list = byParent.get(node.parent_id) ?? [];
      list.push(node);
      byParent.set(node.parent_id, list);
    }

    return SITE_NAV.map((section) => {
      const parent = section.categorySlug
        ? nodes.find((n) => n.slug === section.categorySlug)
        : undefined;
      const subs = parent ? (byParent.get(parent.id) ?? []) : [];
      return {
        section,
        children: subs.map((s) => ({ title: s.title, href: `/c/${s.slug}` })),
        // When a category has no sub-categories, load its topics on demand.
        lazyCategoryId: parent && subs.length === 0 && parent.topic_count > 0 ? parent.id : null,
      };
    });
  }, [data]);

  return (
    <nav className="flex flex-col gap-0.5 pb-16 text-sm">
      {sections.map(({ section, children, lazyCategoryId }) => (
        <SidebarSection
          key={section.title}
          title={section.title}
          href={section.href}
          badge={section.badge}
          pathname={pathname}
          children={children}
          lazyCategoryId={lazyCategoryId}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}

function SidebarSection({
  title,
  href,
  badge,
  children,
  lazyCategoryId,
  pathname,
  onNavigate,
}: {
  title: string;
  href: string;
  badge?: string | undefined;
  children: Child[];
  lazyCategoryId?: string | null;
  pathname: string;
  onNavigate?: (() => void) | undefined;
}) {
  const sectionActive = pathname === href || pathname.startsWith(href + "/");
  const childActive = children.some((c) => pathname === c.href);
  const [open, setOpen] = useState(sectionActive || childActive);

  const { data: lazyTopics } = useQuery({
    ...categoryTopicsQuery(lazyCategoryId ?? ""),
    enabled: Boolean(lazyCategoryId) && open,
  });

  const items: Child[] = children.length
    ? children
    : (lazyTopics ?? []).map((t) => ({
        title: t.title,
        href: topicHref(t.content_type, t.slug),
      }));

  return (
    <div>
      <div className="flex items-center">
        <AppLink
          to={href}

          onClick={onNavigate}
          className={cn(
            "flex-1 rounded-md px-2 py-1.5 font-medium transition-colors",
            sectionActive
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/60",
          )}
        >
          {title}
          {badge ? (
            <span className="ml-2 rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {badge}
            </span>
          ) : null}
        </AppLink>
        {children.length > 0 ? (
          <button
            type="button"
            aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
            onClick={() => setOpen((v) => !v)}
            className="rounded-md p-1 text-muted-foreground hover:bg-sidebar-accent/60"
          >
            <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-90")} />
          </button>
        ) : null}
      </div>

      {open && children.length > 0 ? (
        <ul className="ml-3 mt-0.5 space-y-0.5 border-l pl-3">
          {children.map((child) => (
            <li key={child.href}>
              <AppLink
                to={child.href}

                onClick={onNavigate}
                className={cn(
                  "block rounded-md px-2 py-1 text-[0.8125rem] transition-colors",
                  pathname === child.href
                    ? "font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {child.title}
              </AppLink>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
