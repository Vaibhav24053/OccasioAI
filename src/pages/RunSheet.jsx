import { useCallback, useEffect, useState } from "react";
import { ClipboardList, Copy, Loader2, Plus, Printer, RefreshCw, ShieldAlert } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useEvent } from "@/lib/EventContext";
import PageHeader from "@/components/PageHeader";
import RunSheetRow from "@/components/runsheet/RunSheetRow";
import ContingencyItem from "@/components/runsheet/ContingencyItem";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { showUndo } from "@/lib/feedback";
import { formatClock, formatDate } from "@/lib/format";

/** Day-of run sheet: the shareable schedule plus the emergency checklist. */
export default function RunSheet() {
  const { activeEvent } = useEvent();
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState({ start_time: "16:00", activity: "", owner: "", notes: "" });

  const load = useCallback(async () => {
    if (!activeEvent?.id) return;
    const page = await base44.entities.RunSheet.filter(
      { event_id: activeEvent.id },
      { sort: "start_time", limit: 80 },
    );
    setItems(page.items ?? []);
    setLoading(false);
  }, [activeEvent?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const schedule = items.filter((i) => i.item_type !== "contingency");
  const contingency = items.filter((i) => i.item_type === "contingency");

  const generate = async () => {
    setGenerating(true);
    try {
      const [guestPage, vendorPage] = await Promise.all([
        base44.entities.Guest.filter({ event_id: activeEvent.id, rsvp_status: "confirmed" }, { limit: 300 }),
        base44.entities.Vendor.filter({ event_id: activeEvent.id }, { limit: 60 }),
      ]);
      const response = await base44.functions.invoke("generateRunSheet", {
        event: {
          name: activeEvent.name,
          occasion_name: activeEvent.occasion_name,
          event_type: activeEvent.event_type,
          event_date: activeEvent.event_date,
          guest_count: activeEvent.guest_count,
          venue_preference: activeEvent.venue_preference,
          theme: activeEvent.theme,
          culture: activeEvent.culture,
          must_haves: activeEvent.must_haves,
          city: activeEvent.city,
        },
        confirmed_guests: (guestPage.items ?? []).reduce((sum, g) => sum + 1 + (Number(g.plus_ones) || 0), 0),
        vendors: (vendorPage.items ?? []).map((v) => ({
          category: v.category_label || v.category,
          name: v.name,
          phone: v.phone,
          status: v.status,
        })),
      });

      if (items.length) await base44.entities.RunSheet.deleteMany({ event_id: activeEvent.id });
      const rows = [
        ...(response.data?.schedule || []).map((row, i) => ({ ...row, item_type: "schedule", sort_order: i })),
        ...(response.data?.contingency || []).map((row, i) => ({ ...row, item_type: "contingency", sort_order: i })),
      ];
      if (rows.length) {
        await base44.entities.RunSheet.bulkCreate(rows.map((row) => ({ ...row, event_id: activeEvent.id })));
      }
      await load();
      toast({ title: "Run sheet ready", description: "Share it, print it, or keep refining it." });
    } finally {
      setGenerating(false);
    }
  };

  const toggle = async (item) => {
    await base44.entities.RunSheet.update(item.id, { done: !item.done });
    await load();
  };

  const remove = async (item) => {
    await base44.entities.RunSheet.delete(item.id);
    await load();
    const { id, ...rest } = item;
    showUndo(toast, {
      title: "Line removed",
      description: item.activity,
      undo: async () => {
        await base44.entities.RunSheet.create(rest);
        await load();
      },
    });
  };

  const addItem = async (e) => {
    e.preventDefault();
    await base44.entities.RunSheet.create({
      event_id: activeEvent.id,
      item_type: "schedule",
      start_time: draft.start_time,
      activity: draft.activity,
      owner: draft.owner,
      notes: draft.notes,
    });
    setDraft({ start_time: draft.start_time, activity: "", owner: "", notes: "" });
    setAddOpen(false);
    await load();
  };

  const asText = () =>
    [
      `${activeEvent.name} — run sheet (${formatDate(activeEvent.event_date)})`,
      "",
      ...schedule.map((s) => `${formatClock(s.start_time)} — ${s.activity}${s.owner ? ` (${s.owner})` : ""}`),
      "",
      "EMERGENCY CHECKLIST",
      ...contingency.map((c) => `[${c.done ? "x" : " "}] ${c.activity}${c.notes ? ` — ${c.notes}` : ""}`),
    ].join("\n");

  const copyAll = async () => {
    await navigator.clipboard?.writeText(asText());
    toast({ title: "Run sheet copied", description: "Paste it into your family WhatsApp group." });
  };

  if (!activeEvent) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No event selected"
        description="Create an event and I'll write the minute-by-minute schedule for the day."
        action={<Button asChild><a href="/onboarding">Plan an event</a></Button>}
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-16 rounded-3xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Day-of run sheet"
        title="The day, minute by minute"
        subtitle={`${formatDate(activeEvent.event_date, "dddd D MMMM")} · hand this to your family, your MC and your vendors.`}
        actions={
          <>
            {items.length ? (
              <>
                <Button variant="outline" className="rounded-full no-print" onClick={copyAll}>
                  <Copy className="mr-2 h-4 w-4" aria-hidden="true" /> Copy
                </Button>
                <Button variant="outline" className="rounded-full no-print" onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" aria-hidden="true" /> Print
                </Button>
                <Button variant="outline" className="rounded-full no-print" onClick={() => setAddOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Add line
                </Button>
              </>
            ) : null}
            <Button
              onClick={generate}
              disabled={generating}
              className="rounded-full gradient-brand text-white no-print"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> Building…
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                  {items.length ? "Regenerate" : "Generate run sheet"}
                </>
              )}
            </Button>
          </>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No run sheet yet"
          description="Tell me your venue and guest count and I'll write the whole day — arrivals, ceremony, food, speeches, cake, wrap-up — plus the emergency checklist."
          action={<Button onClick={generate}>Generate my run sheet</Button>}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <section className="lg:col-span-2 rounded-3xl bg-card p-4 shadow-soft ring-hairline sm:p-5">
            <h2 className="font-display text-lg text-foreground">Schedule</h2>
            <ul className="mt-2 divide-y divide-border/60">
              {schedule.map((item) => (
                <RunSheetRow key={item.id} item={item} onToggle={toggle} onDelete={remove} />
              ))}
            </ul>
          </section>

          <section className="rounded-3xl bg-card p-4 shadow-soft ring-hairline sm:p-5">
            <h2 className="flex items-center gap-2 font-display text-lg text-foreground">
              <ShieldAlert className="h-4 w-4 text-primary" aria-hidden="true" /> Emergency checklist
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Backup contacts, a rain plan and the first-aid kit. Tick these off the night before.
            </p>
            <ul className="mt-3">
              {contingency.map((item) => (
                <ContingencyItem key={item.id} item={item} onToggle={toggle} />
              ))}
            </ul>
          </section>
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add a line to the run sheet</DialogTitle>
          </DialogHeader>
          <form onSubmit={addItem} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="rs-time">Start time</Label>
                <Input
                  id="rs-time"
                  type="time"
                  value={draft.start_time}
                  onChange={(e) => setDraft((p) => ({ ...p, start_time: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="rs-owner">Owner</Label>
                <Input
                  id="rs-owner"
                  placeholder="Uncle Ravi"
                  value={draft.owner}
                  onChange={(e) => setDraft((p) => ({ ...p, owner: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="rs-activity">What happens?</Label>
              <Input
                id="rs-activity"
                required
                value={draft.activity}
                onChange={(e) => setDraft((p) => ({ ...p, activity: e.target.value }))}
                placeholder="Guests arrive, welcome drinks served"
              />
            </div>
            <div>
              <Label htmlFor="rs-notes">Notes</Label>
              <Input
                id="rs-notes"
                value={draft.notes}
                onChange={(e) => setDraft((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Keep the dhol away from the cake table"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save line</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}