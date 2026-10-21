import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, PartyPopper, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useEvent } from "@/lib/EventContext";
import CountdownTimer from "@/components/CountdownTimer";
import PlanningScore from "@/components/PlanningScore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { celebrateBig } from "@/lib/feedback";
import { splitBudget } from "@/lib/budget";
import { formatMoney, todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Maps an AI vendor category ("caterer") onto a budget category ("catering"). */
function inferBudgetCategory(vendorCategory = "") {
  const value = vendorCategory.toLowerCase();
  if (/(cater|chef|food|bar)/.test(value)) return "catering";
  if (/(decor|florist|flower|balloon)/.test(value)) return "decor";
  if (/(photo|video)/.test(value)) return "photography";
  if (/(music|dj|band|entertain)/.test(value)) return "entertainment";
  if (/(venue|hall|rental)/.test(value)) return "venue";
  if (/(cake|dessert|bakery)/.test(value)) return "cake_desserts";
  if (/(invit|stationer|print)/.test(value)) return "invitations";
  if (/(makeup|hair|attire|stylist)/.test(value)) return "attire_beauty";
  if (/(gift|favour|favor)/.test(value)) return "gifts_favors";
  if (/(sound|light|av|screen)/.test(value)) return "av_production";
  return null;
}

/**
 * Writes the whole plan to the database in one pass, then shows the reveal:
 * name ideas, the cost split, the countdown and the starting planning score.
 */
export default function BlueprintReveal({ intake, blueprint, saving, error }) {
  const { addEvent, patchEvent } = useEvent();
  const [event, setEvent] = useState(null);
  const [created, setCreated] = useState(false);
  const started = useRef(false);

  const categories = useMemo(
    () => splitBudget(intake.budget_total, intake.event_type),
    [intake.budget_total, intake.event_type],
  );

  useEffect(() => {
    if (saving || error || started.current || !blueprint) return;
    started.current = true;
    (async () => {
      const name = blueprint.name_suggestions?.[0] || intake.occasion_name || "My event";
      const newEvent = await base44.entities.Event.create({
        name,
        event_type: intake.event_type,
        occasion_name: intake.occasion_name,
        guest_count: Number(intake.guest_count) || 0,
        event_date: intake.event_date,
        date_flexibility: intake.date_flexibility,
        city: intake.city,
        venue_preference: intake.venue_preference,
        venue_capacity: blueprint.venue_capacity || Math.round((Number(intake.guest_count) || 0) * 1.1),
        budget_total: Number(intake.budget_total) || 0,
        currency: intake.currency || "INR",
        budget_flexibility: intake.budget_flexibility,
        theme: intake.theme,
        culture: intake.culture,
        must_haves: intake.must_haves,
        no_gos: intake.no_gos,
        name_suggestions: blueprint.name_suggestions || [],
        summary: blueprint.summary || "",
        status: "planning",
      });

      await base44.entities.BudgetCategory.bulkCreate(
        categories.map((c) => ({ ...c, event_id: newEvent.id })),
      );

      const eventDate = new Date(intake.event_date);
      await base44.entities.Task.bulkCreate(
        (blueprint.tasks || []).map((task, i) => {
          const due = new Date(eventDate);
          due.setDate(due.getDate() - (Number(task.days_before) || 0));
          return {
            event_id: newEvent.id,
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

      const allocation = Object.fromEntries(categories.map((c) => [c.category, c.allocated]));
      await base44.entities.Vendor.bulkCreate(
        (blueprint.vendor_categories || []).map((vendor, i) => {
          const budgetKey = inferBudgetCategory(vendor.category || vendor.label || "");
          return {
            event_id: newEvent.id,
            category: (vendor.category || vendor.label || "vendor").toLowerCase(),
            category_label: vendor.label || vendor.category,
            name: "",
            status: "researching",
            why: vendor.why || "",
            budget_allocated: budgetKey ? allocation[budgetKey] : 0,
            sort_order: i,
          };
        }),
      );

      setEvent(newEvent);
      addEvent(newEvent);
      setCreated(true);
      celebrateBig();
    })();
  }, [blueprint, saving, error, intake, categories, addEvent]);

  const pickName = async (name) => {
    if (!event || name === event.name) return;
    await base44.entities.Event.update(event.id, { name });
    patchEvent(event.id, { name });
    setEvent((prev) => ({ ...prev, name }));
  };

  if (saving) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        <p className="font-display text-xl text-foreground">Writing your event blueprint…</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Splitting the budget, scheduling every task backwards from your date, and working out which
          vendors you'll need.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="rounded-3xl bg-destructive/10 p-6 text-sm text-destructive">
        The blueprint couldn't be generated just now: {error}. Try again from the start.
      </div>
    );
  }

  if (!blueprint) return null;

  return (
    <div className="space-y-6">
      <header className="rounded-[28px] gradient-brand px-6 py-8 text-white shadow-lift">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/80">Your blueprint</p>
        <h1 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">
          {event?.name || blueprint.name_suggestions?.[0] || "Your event"}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/85">{blueprint.summary}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <CountdownTimer date={intake.event_date} />
          <div className="rounded-2xl bg-white/15 p-4 backdrop-blur-sm">
            <PlanningScore score={4} />
            <p className="mt-2 text-xs text-white/80">
              {blueprint.tasks?.length || 0} tasks · {blueprint.vendor_categories?.length || 0} vendor categories
              · {categories.length} budget buckets
            </p>
          </div>
        </div>
      </header>

      <section className="rounded-3xl bg-card p-5 shadow-soft ring-hairline">
        <h2 className="font-display text-lg text-foreground">Name ideas</h2>
        <p className="mt-1 text-sm text-muted-foreground">Tap one to use it.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(blueprint.name_suggestions || []).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => pickName(name)}
              aria-pressed={event?.name === name}
              className={cn(
                "rounded-full px-3.5 py-2 text-sm font-medium transition",
                event?.name === name
                  ? "gradient-brand text-white"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
              )}
            >
              {name}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-card p-5 shadow-soft ring-hairline">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-foreground">Estimated cost breakdown</h2>
          <Badge variant="secondary" className="rounded-full">
            {formatMoney(intake.budget_total, intake.currency)}
          </Badge>
        </div>
        <ul className="mt-4 space-y-3">
          {categories.map((c) => (
            <li key={c.category}>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium text-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} aria-hidden="true" />
                  {c.label}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {formatMoney(c.allocated, intake.currency)} · {c.weight}%
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
                <div className="h-full rounded-full" style={{ width: `${c.weight}%`, background: c.color }} />
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          Includes a 10% contingency buffer — the slice that saves you when the quote goes up.
        </p>
      </section>

      <div className="flex flex-col items-center gap-3 pb-4 sm:flex-row sm:justify-center">
        <Button
          asChild
          size="lg"
          disabled={!created}
          className="w-full rounded-full gradient-brand text-white sm:w-auto"
        >
          <a href="/">
            <PartyPopper className="mr-2 h-4 w-4" aria-hidden="true" /> Open my dashboard
          </a>
        </Button>
        <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Everything is saved — refresh whenever you like. Logged {todayISO()}
        </p>
      </div>
    </div>
  );
}