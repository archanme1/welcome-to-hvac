import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Menu, PanelLeftClose, PanelLeftOpen, Home, BookOpen, Calculator, Bot, Store, ShoppingBag, Search, Moon, Sun, User2, LogOut, Shield, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarNav } from "./sidebar-nav";
import { SearchDialog } from "./search-dialog";
import { LiveLearners } from "./live-learners";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import hvacLogo from "@/assets/hvac-logo.png.asset.json";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(pathname === "/");
  const isInitialPath = useRef(true);

  // Initial homepage state is already closed; later arrivals reset on the path change.
  useEffect(() => {
    if (isInitialPath.current) {
      isInitialPath.current = false;
      if (pathname !== "/") {
        setCollapsed(window.localStorage.getItem("wth-sidebar-collapsed") === "1");
      }
      return;
    }
    if (pathname === "/") {
      setCollapsed(true);
      setMobileOpen(false);
      return;
    }
    setCollapsed(window.localStorage.getItem("wth-sidebar-collapsed") === "1");
  }, [pathname]);
  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    window.localStorage.setItem("wth-sidebar-collapsed", next ? "1" : "0");
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-2 px-3 sm:px-5">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[19rem] p-0">
              <SheetTitle className="border-b px-4 py-3.5 text-sm font-semibold">
                Menu
              </SheetTitle>
              <ScrollArea className="h-[calc(100vh-3.5rem)] px-3 py-3">
                <SidebarNav onNavigate={() => setMobileOpen(false)} />
              </ScrollArea>
            </SheetContent>
          </Sheet>

          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:inline-flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            onClick={toggleCollapsed}
          >
            {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </Button>

          <Link to="/" className="flex min-w-0 items-center gap-2">
            <img
              src={hvacLogo.url}
              alt="Welcome to HVAC logo"
              className="h-7 w-7 shrink-0 rounded-md"
            />
            <span className="truncate text-sm font-semibold tracking-tight sm:text-base">
              Welcome to HVAC
            </span>
          </Link>

          <div className="flex-1" />

          <LiveLearners />

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden h-9 w-64 items-center gap-2 rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted md:flex"
          >
            <Search className="h-4 w-4" />
            <span>Search HVAC...</span>
            <kbd className="ml-auto rounded border bg-background px-1.5 py-0.5 text-[10px] font-medium">
              ⌘K
            </kbd>
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>

          <ThemeToggle />
          <AccountMenu />
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px]">
        {collapsed ? (
          <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-14 shrink-0 flex-col items-center gap-1 border-r py-4 lg:flex">
            {RAIL.map((r) => (
              <Link
                key={r.to}
                to={r.to}
                title={r.label}
                aria-label={r.label}
                onClick={r.expand ? toggleCollapsed : () => undefined}
                activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
                activeOptions={{ exact: r.to === "/" }}
                className="grid h-9 w-9 place-items-center rounded-md text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60"
              >
                <r.icon className="h-4.5 w-4.5" />
              </Link>
            ))}
          </aside>
        ) : (
          <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-[17rem] shrink-0 border-r lg:block">
            <ScrollArea className="h-full px-4 py-5">
              <SidebarNav />
            </ScrollArea>
          </aside>
        )}
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}

const RAIL: { to: string; label: string; icon: typeof Home; expand?: boolean }[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/start-here", label: "Start Here", icon: Sparkles },
  { to: "/c/hvac-fundamentals", label: "Documentation", icon: BookOpen, expand: true },
  { to: "/calculators", label: "Engineering Tools & Calculators", icon: Calculator },
  { to: "/ai-tutor", label: "AI Tutor", icon: Bot },
  { to: "/marketplace", label: "Marketplace", icon: Store },
  { to: "/shop", label: "Shop", icon: ShoppingBag },
];

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={toggle}>
      {theme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
    </Button>
  );
}

function AccountMenu() {
  const { user, isPro, isStaff, username } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  if (!user) {
    return (
      <Button asChild size="sm" className="h-9">
        <Link to="/auth">Sign in</Link>
      </Button>
    );
  }

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Account">
          <User2 className="h-4.5 w-4.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="truncate text-sm font-medium">{username ?? user.email}</p>
          <p className="text-xs text-muted-foreground">{isPro ? "HVAC Pro" : "Free account"}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/account">Account</Link>
        </DropdownMenuItem>
        {!isPro ? (
          <DropdownMenuItem asChild>
            <Link to="/pricing">
              <Sparkles className="mr-2 h-4 w-4" /> Upgrade to Pro
            </Link>
          </DropdownMenuItem>
        ) : null}
        {isStaff ? (
          <DropdownMenuItem asChild>
            <Link to="/admin">
              <Shield className="mr-2 h-4 w-4" /> Admin
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut()}>
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
