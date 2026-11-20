import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MarketplaceSubnav } from "@/components/marketplace/subnav";
import { ProOnly } from "@/components/marketplace/pro-gate";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/marketplace/messages")({
  ssr: false,
  validateSearch: (s) => z.object({ c: z.string().uuid().optional().catch(undefined) }).parse(s),
  head: () => ({ meta: [{ title: "Messages — Trades Marketplace" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <MarketplaceSubnav />
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Messages & Inquiries</h1>
      <ProOnly><Inbox /></ProOnly>
    </div>
  ),
});

type Conv = { id: string; listing_id: string; buyer_id: string; seller_id: string; buyer_last_read: string; seller_last_read: string; last_message_at: string; listing: { title: string; slug: string; status: string } | null };

function Inbox() {
  const { user } = useAuth();
  const { c } = Route.useSearch();
  const navigate = useNavigate({ from: "/marketplace/messages" });
  const { data, refetch } = useQuery({
    queryKey: ["mk", "convs", user?.id],
    enabled: !!user,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data: convs } = await supabase.from("marketplace_conversations")
        .select("id, listing_id, buyer_id, seller_id, buyer_last_read, seller_last_read, last_message_at, listing:marketplace_listings(title, slug, status)")
        .order("last_message_at", { ascending: false }).limit(100);
      const list = (convs ?? []) as unknown as Conv[];
      const others = list.map((x) => (x.buyer_id === user!.id ? x.seller_id : x.buyer_id));
      const { data: names } = others.length ? await supabase.rpc("marketplace_sellers", { _ids: Array.from(new Set(others)) }) : { data: [] };
      const nameMap = Object.fromEntries((names ?? []).map((n) => [n.id, n.name]));
      return list.map((x) => {
        const mine = x.buyer_id === user!.id ? x.buyer_last_read : x.seller_last_read;
        return { ...x, other: nameMap[x.buyer_id === user!.id ? x.seller_id : x.buyer_id] ?? "Member", role: x.buyer_id === user!.id ? "Buying" : "Selling", unread: new Date(x.last_message_at) > new Date(mine) };
      });
    },
  });
  const selected = data?.find((x) => x.id === c) ?? null;

  return (
    <div className="grid gap-4 md:grid-cols-[280px_1fr]">
      <ul className={cn("divide-y rounded-lg border bg-card", selected && "hidden md:block")}>
        {data?.length ? data.map((x) => (
          <li key={x.id}>
            <button type="button" onClick={() => void navigate({ search: { c: x.id } })} className={cn("w-full p-3 text-left hover:bg-accent/50", x.id === c && "bg-accent")}>
              <p className={cn("line-clamp-1 text-sm", x.unread ? "font-semibold" : "")}>{x.listing?.title ?? "Listing removed"}</p>
              <p className="text-xs text-muted-foreground">{x.role} · {x.other}{x.unread ? " · New" : ""}</p>
            </button>
          </li>
        )) : <li className="p-6 text-sm text-muted-foreground">No conversations yet. Use "Contact Seller" on a listing to start one.</li>}
      </ul>
      {selected ? <Thread conv={selected} onSent={() => void refetch()} onBack={() => void navigate({ search: {} })} /> : (
        <div className="hidden items-center justify-center rounded-lg border bg-card p-8 text-sm text-muted-foreground md:flex">Select a conversation.</div>
      )}
    </div>
  );
}

function Thread({ conv, onSent, onBack }: { conv: Conv & { other: string }; onSent: () => void; onBack: () => void }) {
  const { user } = useAuth();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const { data, refetch } = useQuery({
    queryKey: ["mk", "msgs", conv.id],
    refetchInterval: 15_000,
    queryFn: async () => (await supabase.from("marketplace_messages").select("id, sender_id, body, created_at").eq("conversation_id", conv.id).order("created_at").limit(500)).data ?? [],
  });
  useEffect(() => { void supabase.rpc("marketplace_mark_read", { _conversation_id: conv.id }).then(onSent); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [conv.id, data?.length]);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [data?.length]);

  const send = async () => {
    const text = body.trim();
    if (!text) return;
    setBusy(true);
    const { error } = await supabase.from("marketplace_messages").insert({ conversation_id: conv.id, sender_id: user!.id, body: text.slice(0, 2000) });
    setBusy(false);
    if (error) return void toast.error(error.message.includes("too quickly") ? error.message : "Message failed. Make sure your Pro membership is active.");
    setBody("");
    void refetch();
    onSent();
  };

  return (
    <div className="flex min-h-[420px] flex-col rounded-lg border bg-card">
      <div className="flex items-center justify-between gap-2 border-b p-3">
        <div>
          <button type="button" onClick={onBack} className="mb-1 text-xs text-muted-foreground md:hidden">← All conversations</button>
          {conv.listing?.status === "active" ? <Link to="/marketplace/listing/$slug" params={{ slug: conv.listing.slug }} className="text-sm font-semibold hover:underline">{conv.listing.title}</Link> : <p className="text-sm font-semibold">{conv.listing?.title ?? "Listing removed"}</p>}
          <p className="text-xs text-muted-foreground">with {conv.other}</p>
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3" style={{ maxHeight: 480 }}>
        {(data ?? []).map((m) => (
          <div key={m.id} className={cn("max-w-[80%] rounded-lg px-3 py-2 text-sm", m.sender_id === user?.id ? "ml-auto bg-primary text-primary-foreground" : "bg-muted")}>
            <p className="whitespace-pre-line">{m.body}</p>
            <p className="mt-1 text-[10px] opacity-70">{new Date(m.created_at).toLocaleString("en-CA", { dateStyle: "short", timeStyle: "short" })}</p>
          </div>
        ))}
        <div ref={end} />
      </div>
      <div className="flex gap-2 border-t p-3">
        <Textarea rows={2} maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a reply…" className="flex-1"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }} />
        <Button onClick={send} disabled={busy || !body.trim()}>Send</Button>
      </div>
      <p className="px-3 pb-3 text-[11px] text-muted-foreground">Payments and exchanges are arranged between you. Never send money before seeing an item, and meet somewhere public.</p>
    </div>
  );
}
