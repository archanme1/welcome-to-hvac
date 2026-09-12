import { useRouterState } from "@tanstack/react-router";
import { AppLink } from "@/components/app-link";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { SITE_NAV } from "@/lib/site-nav";
import { navigationQuery } from "@/lib/hvac.functions";
import { topicHref } from "@/lib/hvac-types";

type Child = { title: string; href: string };

export function SidebarNav({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const { data } = useQuery(navigationQuery);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const childrenBySection = useMemo(() => {
    const map: Record<string, Child[]> = {};
    if (!data) return map;
    const byParent = new Map<string, typeof data.categories>();
    for (const cat of data.categories) {
      if (!cat.parent_id) continue;
      const list = byParent.get(cat.parent_id) ?? [];
      list.push(cat);
      byParent.set(cat.parent_id, list);
    }
    for (const section of SITE_NAV) {
      if (!section.categorySlug) continue;
      const parent = data.categories.find((c) => c.slug === section.categorySlug);
      if (!parent) continue;
      const subs = byParent.get(parent.id) ?? [];
      if (subs.length) {
        map[section.title] = subs.map((s) => ({ title: s.title, href: `/c/${s.slug}` }));
      } else {
        map[section.title] = data.topics
          .filter((t) => t.category_id === parent.id)
          .slice(0, 60)
          .map((t) => ({ title: t.title, href: topicHref(t.content_type, t.slug) }));
      }
    }
    return map;
  }, [data]);

  return (
    <nav className="flex flex-col gap-0.5 pb-16 text-sm">
      {SITE_NAV.map((section) => (
        <SidebarSection
          key={section.title}
          title={section.title}
          href={section.href}
          badge={section.badge}
          pathname={pathname}
          children={childrenBySection[section.title] ?? []}
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
  pathname,
  onNavigate,
}: {
  title: string;
  href: string;
  badge?: string | undefined;
  children: Child[];
  pathname: string;
  onNavigate?: (() => void) | undefined;
}) {
  const sectionActive = pathname === href || pathname.startsWith(href + "/");
  const childActive = children.some((c) => pathname === c.href);
  const [open, setOpen] = useState(sectionActive || childActive);

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
