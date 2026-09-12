import { Callout } from "./callout";
import { Diagram } from "./diagrams";
import type { Block, Section } from "@/lib/hvac-types";

export function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case "heading":
      return <h2 id={slugify(block.text)}>{block.text}</h2>;
    case "subheading":
      return <h3 id={slugify(block.text)}>{block.text}</h3>;
    case "paragraph":
      return <p>{block.text}</p>;
    case "list":
      return block.ordered ? (
        <ol>
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      ) : (
        <ul>
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    case "steps":
      return (
        <ol className="mt-4 space-y-3">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-semibold">
                {i + 1}
              </span>
              <span className="text-[0.95rem] leading-7 text-foreground/85">{item}</span>
            </li>
          ))}
        </ol>
      );
    case "table":
      return (
        <div className="mt-6 overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="bg-muted/50">
              <tr>
                {block.headers.map((h) => (
                  <th key={h} className="px-3 py-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} className="border-t">
                  {row.map((cell, j) => (
                    <td key={j} className="px-3 py-2 align-top text-foreground/85">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "definition":
      return (
        <div className="mt-6 rounded-lg border-l-2 border-foreground/25 bg-muted/30 py-2 pl-4">
          <p className="text-sm font-semibold">{block.term}</p>
          <p className="mt-1 text-[0.9rem] leading-6 text-foreground/85">{block.text}</p>
        </div>
      );
    case "formula":
      return (
        <div className="mt-6 rounded-lg border bg-muted/30 px-4 py-3">
          <code className="font-mono text-sm">{block.expression}</code>
          {block.text ? (
            <p className="mt-1.5 text-xs text-muted-foreground">{block.text}</p>
          ) : null}
        </div>
      );
    case "callout":
      return (
        <Callout variant={block.variant} title={block.title}>
          {block.text}
        </Callout>
      );
    case "diagram":
      return <Diagram diagramKey={block.diagram} caption={block.caption} />;
    case "image":
      return (
        <figure className="mt-6">
          <img
            src={block.url}
            alt={block.alt}
            loading="lazy"
            decoding="async"
            className="w-full rounded-lg border"
          />
          {block.caption ? (
            <figcaption className="mt-2 text-xs text-muted-foreground">{block.caption}</figcaption>
          ) : null}
        </figure>
      );
    case "symptom":
      return (
        <div className="mt-6 rounded-lg border bg-card px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Symptom
          </p>
          <p className="mt-1 text-[0.95rem] leading-6">{block.text}</p>
        </div>
      );
    case "checks":
      return (
        <div className="mt-6 divide-y rounded-lg border">
          {block.items.map((item, i) => (
            <div key={i} className="grid gap-1 px-4 py-3 sm:grid-cols-[1fr_1.2fr] sm:gap-4">
              <p className="text-sm font-medium">{item.check}</p>
              <p className="text-sm text-muted-foreground">{item.meaning}</p>
            </div>
          ))}
        </div>
      );
    default:
      return null;
  }
}

export function SectionRenderer({ section }: { section: Section }) {
  if (!section.blocks?.length) return null;
  return (
    <section id={section.id} className="scroll-mt-24">
      <h2 className="mt-12 border-b pb-2 text-xl font-semibold tracking-tight sm:text-2xl">
        {section.title}
      </h2>
      <div className="prose-doc">
        {section.blocks.map((block, i) => (
          <BlockRenderer key={i} block={block} />
        ))}
      </div>
    </section>
  );
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
