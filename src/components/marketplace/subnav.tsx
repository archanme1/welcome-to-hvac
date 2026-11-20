import { Link } from "@tanstack/react-router";

const LINKS = [
  { to: "/marketplace", label: "Explore" },
  { to: "/marketplace/new", label: "Post a Listing" },
  { to: "/marketplace/mine", label: "My Listings" },
  { to: "/marketplace/messages", label: "Messages" },
] as const;

export function MarketplaceSubnav() {
  return (
    <nav className="mb-6 flex gap-1 overflow-x-auto border-b text-sm">
      {LINKS.map((l) => (
        <Link key={l.to} to={l.to} activeOptions={{ exact: true, includeSearch: false }}
          className="whitespace-nowrap border-b-2 border-transparent px-3 py-2 text-muted-foreground hover:text-foreground"
          activeProps={{ className: "border-primary text-foreground font-medium" }}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
