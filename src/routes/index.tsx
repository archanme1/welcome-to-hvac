import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowRight, BookOpen, Bot, Building2, Calculator, Check, ClipboardCheck, Cog, Factory,
  HardHat, ListChecks, Sparkles, Stethoscope, Store, Thermometer, Wrench,
} from "lucide-react";

import { AppLink } from "@/components/app-link";
import { Button } from "@/components/ui/button";
import { navigationQuery } from "@/lib/hvac.functions";
import { todaysFactQuery } from "@/lib/calculators.functions";
import { TradeKnowledge } from "@/components/home/trade-knowledge";
import { CONTENT_TYPE_LABEL, topicHref } from "@/lib/hvac-types";
import { pageMeta } from "@/lib/seo";

const DESC =
  "Learn HVAC fundamentals, equipment and components, troubleshoot real problems and use professional calculators. Structured HVAC documentation, diagrams, diagnostics and practice — from the refrigeration cycle to furnace sequence of operation, charging and troubleshooting.";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    void context.queryClient.prefetchQuery(todaysFactQuery);
    return context.queryClient.ensureQueryData(navigationQuery);
  },
  head: () => pageMeta({
    title: "Welcome to HVAC — Learn HVAC, Master the Trade",
    description: DESC,
    path: "/",
  }),
  errorComponent: () => (
    <p className="p-8 text-sm text-muted-foreground">This page didn't load. Please refresh.</p>
  ),
  component: Home,
});


const DOCS = [
  { icon: BookOpen, title: "HVAC Fundamentals", to: "/c/hvac-fundamentals", text: "Heat transfer, pressure, airflow and the refrigeration cycle." },
  { icon: Factory, title: "Equipment", to: "/equipment", text: "Furnaces, heat pumps, air conditioners and how they operate." },
  { icon: Cog, title: "Components", to: "/components", text: "Compressors, valves, motors, controls and what each one does." },
  { icon: HardHat, title: "Installation", to: "/c/installation", text: "Setting, piping, venting and commissioning equipment properly." },
  { icon: Wrench, title: "Service & Maintenance", to: "/c/service-maintenance", text: "Routine checks that keep systems safe and efficient." },
  { icon: Stethoscope, title: "Troubleshooting", to: "/troubleshooting", text: "Start from the symptom and narrow down the cause." },
  { icon: Building2, title: "Building Science", to: "/c/building-science", text: "Envelope, moisture and load — the house as a system." },
  { icon: ClipboardCheck, title: "Safety", to: "/c/safety", text: "Electrical, gas, combustion and refrigerant safety basics." },
];

const PRACTICE = [
  { icon: ListChecks, title: "Practice Questions", text: "Topic questions with worked explanations." },
  { icon: Check, title: "Quizzes", text: "Check yourself topic by topic." },
  { icon: Thermometer, title: "Troubleshooting Scenarios", text: "Real-world calls with readings and diagnosis." },
];

const PRO = [
  "AI Tutor grounded in every topic",
  "Practice questions with explanations",
  "Quizzes by topic and difficulty",
  "Interactive troubleshooting scenarios",
  "Equipment scenarios and advanced interactions",
  "Progress tracking across the knowledge base",
];

const card =
  "group rounded-xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md";

function SectionHead({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">{text}</p>
    </div>
  );
}

function Home() {
  const { data } = useSuspenseQuery(navigationQuery);
  const featured = data.topics.slice(0, 6);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-16">
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-muted/70 via-card to-background px-6 py-12 sm:px-10 sm:py-16">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Free HVAC documentation, practice and tools
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Learn HVAC. Master the Trade. Build Your Future.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">{DESC}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/c/$slug" params={{ slug: "hvac-fundamentals" }}>
                Explore Documentation <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/pricing">Explore Pro</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            New here? <Link to="/start-here" className="underline underline-offset-4 hover:text-foreground">Start Here</Link> for a suggested learning order.
          </p>
        </div>
      </section>

      <TradeKnowledge />

      <section className="mt-16">
        <SectionHead eyebrow="Documentation" title="Explore the Documentation" text="Free, structured reference organised the way the trade works." />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DOCS.map((d) => (
            <AppLink key={d.title} to={d.to} className={card}>
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-muted text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <d.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-sm font-semibold">{d.title}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{d.text}</p>
            </AppLink>
          ))}
        </div>
      </section>

      <section className="mt-16 grid gap-6 rounded-2xl border bg-card p-6 sm:p-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
        <div>
          <SectionHead eyebrow="Practice & Mastery" title="Learn through practice" text="Turn reading into skill with questions, quizzes and scenarios linked to each topic." />
          <Button asChild className="mt-6">
            <Link to="/practice">Go to Practice & Mastery</Link>
          </Button>
        </div>
        <div className="grid gap-3">
          {PRACTICE.map((p) => (
            <Link key={p.title} to="/practice" className="flex items-start gap-4 rounded-xl border bg-background p-4 transition-colors hover:bg-accent/50">
              <p.icon className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <h3 className="text-sm font-semibold">{p.title}</h3>
                <p className="text-sm text-muted-foreground">{p.text}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-16 grid gap-4 lg:grid-cols-2">
        <div className={card + " p-6 sm:p-8"}>
          <Calculator className="h-7 w-7" />
          <h2 className="mt-4 text-xl font-bold tracking-tight">Engineering Tools & Calculators</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            A free universal unit converter and safety checklists, plus HVAC calculators for superheat, subcooling, CFM, duct sizing, voltage drop and more — each with formulas. Some results unlock with Pro.
          </p>
          <Button asChild variant="outline" className="mt-5">
            <Link to="/calculators">Browse calculators</Link>
          </Button>
        </div>
        <div className={card + " p-6 sm:p-8"}>
          <Bot className="h-7 w-7" />
          <h2 className="mt-4 text-xl font-bold tracking-tight">AI Tutor</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            A learning companion for HVAC questions that knows the topic you're reading. Included with HVAC Pro, with a daily question limit.
          </p>
          <Button asChild variant="outline" className="mt-5">
            <Link to="/ai-tutor">Meet the AI Tutor</Link>
          </Button>
        </div>
      </section>

      <section className="mt-16 rounded-2xl border bg-card p-6 sm:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <Store className="h-7 w-7" />
            <h2 className="mt-4 text-2xl font-bold tracking-tight">The Trades Marketplace</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Discover tools, equipment, parts and supplies from people across the trades.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[26rem]">
            <div className="rounded-xl border bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Everyone</p>
              <p className="mt-1 text-sm font-medium">Browse listings free</p>
            </div>
            <div className="rounded-xl border bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">HVAC Pro</p>
              <p className="mt-1 text-sm font-medium">Post listings and contact sellers</p>
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link to="/marketplace">Browse Marketplace</Link></Button>
          <Button asChild variant="ghost"><Link to="/pricing">Become a Pro Seller</Link></Button>
        </div>
      </section>

      {featured.length ? (
        <section className="mt-16">
          <SectionHead eyebrow="Popular topics" title="Start reading" text="A few places to begin in the library." />
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((topic) => (
              <AppLink key={topic.id} to={topicHref(topic.content_type, topic.slug)} className={card + " p-4"}>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {CONTENT_TYPE_LABEL[topic.content_type]}
                </p>
                <h3 className="mt-1 text-sm font-semibold">{topic.title}</h3>
                {topic.summary ? (
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{topic.summary}</p>
                ) : null}
              </AppLink>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-16 overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground sm:p-10">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">HVAC Pro</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">Become a Pro member</h2>
            <p className="mt-3 text-sm leading-6 opacity-80">
              The documentation stays free. Pro adds the parts that build real skill.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-6">
              <Link to="/pricing">See HVAC Pro plans</Link>
            </Button>
          </div>
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {PRO.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0" /> {b}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-16 rounded-xl border bg-card p-6">
        <h2 className="text-base font-semibold">Safety and local code</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          This is educational reference material. It never presents bypassing safety controls,
          unsafe energized work, improvised repairs, or improper refrigerant handling as normal
          practice. Installation, venting, combustion air, gas piping, clearances, electrical
          requirements and permits vary by jurisdiction, adopted code edition and equipment —
          always verify local code and the manufacturer's instructions.
        </p>
      </section>
    </div>
  );
}
