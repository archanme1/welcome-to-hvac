import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import {
  adminSaveSettings,
  adminSettingsQuery,
  adminTutorUsageQuery,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/settings")({ component: Settings });

const PRESETS = ["3", "5", "10", "20", "-1"] as const;

function Settings() {
  const { isStaff } = useAuth();
  const qc = useQueryClient();
  const { data: settings } = useQuery(adminSettingsQuery(isStaff));
  const { data: usage } = useQuery(adminTutorUsageQuery(isStaff));
  const [choice, setChoice] = useState("3");
  const [custom, setCustom] = useState("3");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings === undefined) return;
    const value = String(settings.aiTutorDailyLimit);
    setChoice(PRESETS.includes(value as (typeof PRESETS)[number]) ? value : "custom");
    setCustom(value);
  }, [settings]);

  const save = async () => {
    const value = choice === "custom" ? Number(custom) : Number(choice);
    setSaving(true);
    try {
      await adminSaveSettings({ data: { aiTutorDailyLimit: value } });
      await qc.invalidateQueries({ queryKey: ["admin", "settings"] });
      toast.success("Settings saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save settings.");
    } finally {
      setSaving(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const todayRows = (usage ?? []).filter((u) => u.day === today);

  return (
    <div className="max-w-xl space-y-8">
      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">AI Tutor daily limit</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          How many AI Tutor questions each member can ask per day. Resets every day.
        </p>

        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label>Limit</Label>
            <Select value={choice} onValueChange={setChoice}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 per day</SelectItem>
                <SelectItem value="5">5 per day</SelectItem>
                <SelectItem value="10">10 per day</SelectItem>
                <SelectItem value="20">20 per day</SelectItem>
                <SelectItem value="-1">Unlimited</SelectItem>
                <SelectItem value="custom">Custom number…</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {choice === "custom" ? (
            <div className="space-y-1.5">
              <Label htmlFor="custom-limit">Questions per day</Label>
              <Input
                id="custom-limit"
                inputMode="numeric"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
              />
            </div>
          ) : null}

          <Button size="sm" disabled={saving} onClick={() => void save()}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">AI Tutor usage today</h2>
        {todayRows.length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">No questions asked yet today.</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="pb-2 font-medium">Member</th>
                <th className="pb-2 text-right font-medium">Questions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {todayRows.map((u) => (
                <tr key={u.user_id}>
                  <td className="py-2 font-mono text-xs">{u.user_id.slice(0, 8)}…</td>
                  <td className="py-2 text-right">{u.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
