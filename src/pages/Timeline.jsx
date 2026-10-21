import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, CalendarPlus, Check, Flag, Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useEvent } from "@/lib/EventContext";
import PageHeader from "@/components/PageHeader";
import TaskRow from "@/components/timeline/TaskRow";
import DateChangeDialog from "@/components/timeline/DateChangeDialog";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { celebrateSmall, showUndo } from "@/lib/feedback";
import { PHASE_ORDER, phaseForDays, vendorStatusIndex } from "@/lib/budget";
import { daysUntil, formatDate, todayISO } from "@/lib/format";
import { isEmergency } from "@/lib/plan-metrics";
import { cn } from "@/lib/utils";

const VIEWS = [
  { value: "checklist", label: "T-minus checklist" },
  { value: "milestones", label: "Milestones" },
];

/** AI timeline generator: reverse-engineered from the event date, self-adjusting. */
export default function Timeline() {
  const { activeEvent, patchEvent } = useEvent();
  const { toast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("checklist");
  const [dateOpen, setDateOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState({ title: "", due_date: "", priority: "medium" });
  const [vendors, setVendors] = useState([]);

  const load = useCallback(async () => {
    if (!activeEvent?.id) return;
    const [page, vendorPage] = await Promise.all([
      base44.entities.Task.filter({ event_id: activeEvent.id }, { sort: "due_date", limit: 300 }),
      base44.entities.Vendor.filter({ event_id: activeEvent.id }, { limit: 60 }),
    ]);
    setTasks(page.items ?? []);
    setVendors(vendorPage.items ?? []);
    setLoading(false);
  }, [activeEvent?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const grouped = useMemo(() => {
    const buckets = new Map();
    tasks.forEach((task) => {
      const phase = phaseForDays(task.days_before);
      if (!buckets.has(phase.key)) buckets.set(phase.key, { label: phase.label, items: [] });
      buckets.get(phase.key).items.push(task);
    });
    return PHASE_ORDER.filter((key) => buckets.has(key)).map((key) => ({ key, ...buckets.get(key) }));
  }, [tasks]);

  const milestones = useMemo(() => tasks.filter((t) => t.is_milestone), [tasks]);

  const toggle = async (task) => {
    const done = task.status === "done";
    await base44.entities.Task.update(task.id, {
      status: done ? "todo" : "done",
      completed_date: done ? null : todayISO(),
    });
    await load();
    if (!done) {
      celebrateSmall();
      // A late completion is rescheduled rather than silently swallowed.
      if (task.due_date && todayISO() > task.due_date) {
        toast({
          title: "Done, but late",
          description: `This was due ${formatDate(task.due_date)}. I've kept the rest of the timeline as is — anything still ahead of you is unaffected.`,
        });
      }
    }
  };

  const remove = async (task) => {
    await base44.entities.Task.delete(task.id);
    await load();
    const { id, ...rest } = task;
    showUndo(toast, {
      title: "Task removed",
      description: task.title,
      undo: async () => {
        await base44.entities.Task.create(rest);
        await load();
      },
    });
  };

  const addTask = async (e) => {
    e.preventDefault();
    const due = draft.due_date || activeEvent.event_date;
    const days = activeEvent.event_date
      ? Math.max(0, Math.round((new Date(activeEvent.event_date) - new Date(due)) / 86400000))
      : 0;
    await base44.entities.Task.create({
      event_id: activeEvent.id,
      title: draft.title,
      due_date: due,
      days_before: days,
      priority: draft.priority,
      status: "todo",
    });
    setDraft({ title: "", due_date: "", priority: "medium" });
    setAddOpen(false);
    await load();
  };

  /** Rewrites the open half of the timeline for a new date. */
  const applyNewTimeline = useCallback(
    async (eventForCall, keepDone) => {
      const response = await base44.functions.invoke("generateTimeline", {
        event: {
          name: eventForCall.name,
          event_type: eventForCall.event_type,
          occasion_name: eventForCall.occasion_name,
          event_date: eventForCall.event_date,
          guest_count: eventForCall.guest_count,
          city: eventForCall.city,
          culture: eventForCall.culture,
          theme: eventForCall.theme,
          must_haves: eventForCall.must_haves,
          no_gos: eventForCall.no_gos,
        },
        completed_tasks: keepDone ? tasks.filter((t) => t.status === "done").map((t) => t.title) : [],
      });
      const fresh = response.data?.tasks || [];
      await base44.entities.Task.deleteMany({ event_id: eventForCall.id, status: "todo" });
      if (fresh.length) {
        const eventDate = new Date(eventForCall.event_date);
        await base44.entities.Task.bulkCreate(
          fresh.map((task, i) => {
            const due = new Date(eventDate);
            due.setDate(due.getDate() - (Number(task.days_before) || 0));
            return {
              event_id: eventForCall.id,
              title: task.title,
              description: task.description || "",
              category: task.category || "general",
              days_before: Number(task.days_before) || 0,
              due_date: due.toISOString().slice(0, 10),
              priority: task.priority || "medium",
              is_milestone: Boolean(task.is_milestone),
              status: "todo",
              sort_order: i,
            };
          }),
        );
      }
      await load();
    },
    [tasks, load],
  );

  const bookedVendors = useMemo(
    () => vendors.filter((v) => vendorStatusIndex(v.status) >= 2),
    [vendors],
  );

  const changeDate = async (newDate, regenerate, affectedVendors) => {
    const updated = { ...activeEvent, event_date: newDate };
    await base44.entities.Event.update(activeEvent.id, { event_date: newDate });
    patchEvent(activeEvent.id, { event_date: newDate, emergency_mode: isEmergency(newDate) });
    if (regenerate) await applyNewTimeline(updated, true);
    toast({
      title: "Date moved",
      description: affectedVendors?.length
        ? `Timeline rewritten. ${affectedVendors.length} booked vendor(s) need a call.`
        : "Timeline rewritten around the new date.",
    });
  };

  if (!activeEvent) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="No event selected"
        description="Create an event and I'll build its timeline backwards from the date."
        action={<Button asChild><a href="/onboarding">Plan an event</a></Button>}
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-16 rounded-3xl" />
        <Skeleton className="h-24 rounded-3xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  const days = daysUntil(activeEvent.event_date);
  const openCount = tasks.filter((t) => t.status !== "done").length;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Timeline"
        title={days !== null && days >= 0 ? `${days} days to go` : "The big day"}
        subtitle={`${formatDate(activeEvent.event_date, "dddd D MMMM YYYY")} · ${openCount} task${openCount === 1 ? "" : "s"} still open`}
        actions={
          <>
            <Button variant="outline" className="rounded-full" onClick={() => setDateOpen(true)}>
              <CalendarClock className="mr-2 h-4 w-4" aria-hidden="true" /> Change date
            </Button>
            <Button className="rounded-full" onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Add task
            </Button>
          </>
        }
      />

      {isEmergency(activeEvent.event_date) ? (
        <div className="rounded-3xl bg-destructive/10 p-5">
          <h2 className="font-display text-lg text-destructive">Emergency mode</h2>
          <p className="mt-1 text-sm text-foreground">
            This is happening within a week, so I've compressed the timeline into day-by-day moves:
            lock the venue and the caterer first, then decor, then the small things. Skip anything
            that needs a 3-week lead time.
          </p>
        </div>
      ) : null}

      <div className="flex gap-2" role="tablist" aria-label="Timeline view">
        {VIEWS.map((v) => (
          <button
            key={v.value}
            role="tab"
            aria-selected={view === v.value}
            type="button"
            onClick={() => setView(v.value)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              view === v.value ? "gradient-brand text-white" : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
            )}
          >
            {v.label}
          </button>
        ))}
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={CalendarPlus}
          title="No tasks yet"
          description="Ask me to write the whole timeline for this event."
          action={
            <Button
              onClick={async () => {
                await applyNewTimeline(activeEvent, false);
              }}
            >
              Generate my timeline
            </Button>
          }
        />
      ) : view === "checklist" ? (
        <div className="space-y-4">
          {grouped.map((group) => {
            const done = group.items.filter((t) => t.status === "done").length;
            return (
              <section key={group.key} className="rounded-3xl bg-card p-4 shadow-soft ring-hairline sm:p-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-base text-foreground">{group.label}</h2>
                  <span className="text-xs text-muted-foreground">
                    {done}/{group.items.length} done
                  </span>
                </div>
                {done === group.items.length ? (
                  <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <Check className="h-3.5 w-3.5" aria-hidden="true" /> phase complete
                  </p>
                ) : null}
                <ul className="mt-2 divide-y divide-border/60">
                  {group.items.map((task) => (
                    <TaskRow key={task.id} task={task} onToggle={toggle} onDelete={remove} />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      ) : (
        <section className="rounded-3xl bg-card p-5 shadow-soft ring-hairline">
          <h2 className="font-display text-lg text-foreground">Milestones</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The moments that unlock everything else — venue, invitations, final headcount.
          </p>
          {milestones.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No milestones flagged yet. Regenerate the timeline from the date change dialog to get them.
            </p>
          ) : (
            <ol className="mt-4 space-y-4 border-l border-border pl-5">
              {milestones.map((task) => (
                <li key={task.id} className="relative">
                  <span
                    className={cn(
                      "absolute -left-[27px] top-1 grid h-5 w-5 place-items-center rounded-full border-2",
                      task.status === "done" ? "border-primary bg-primary text-white" : "border-primary/40 bg-card",
                    )}
                    aria-hidden="true"
                  >
                    <Flag className="h-2.5 w-2.5" />
                  </span>
                  <p className={cn("text-sm font-semibold text-foreground", task.status === "done" && "line-through")}>
                    {task.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    due {formatDate(task.due_date)} · {phaseForDays(task.days_before).label}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      <DateChangeDialog
        open={dateOpen}
        onOpenChange={setDateOpen}
        event={activeEvent}
        bookedVendors={bookedVendors}
        onConfirm={changeDate}
      />

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add a task</DialogTitle>
          </DialogHeader>
          <form onSubmit={addTask} className="space-y-4">
            <div>
              <Label htmlFor="task-title">What needs doing?</Label>
              <Input
                id="task-title"
                required
                value={draft.title}
                onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
                placeholder="Confirm the caterer's final headcount"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="task-due">Due date</Label>
                <Input
                  id="task-due"
                  type="date"
                  value={draft.due_date}
                  onChange={(e) => setDraft((p) => ({ ...p, due_date: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="task-priority">Priority</Label>
                <select
                  id="task-priority"
                  value={draft.priority}
                  onChange={(e) => setDraft((p) => ({ ...p, priority: e.target.value }))}
                  className="h-11 w-full rounded-2xl border border-input bg-background px-3 text-sm"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save task</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}