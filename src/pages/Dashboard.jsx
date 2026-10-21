import { Link } from "react-router-dom";
import {
  CalendarClock,
  Lightbulb,
  Store,
  Users,
  Wallet,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEvent } from "@/lib/EventContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import EventHero from "@/components/dashboard/EventHero";
import StatGrid from "@/components/dashboard/StatGrid";
import BudgetDonut from "@/components/dashboard/BudgetDonut";
import UpcomingTasks from "@/components/dashboard/UpcomingTasks";
import WelcomeEmpty from "@/components/WelcomeEmpty";
import { planningScore } from "@/lib/plan-metrics";
import { celebrateSmall } from "@/lib/feedback";
import { formatCompact, formatMoney } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

const QUICK_LINKS = [
  { to: "/budget", label: "Budget engine", icon: Wallet, blurb: "Log spend, catch overshoots" },
  { to: "/timeline", label: "Timeline", icon: CalendarClock, blurb: "T-minus checklist" },
  { to: "/vendors", label: "Vendors", icon: Store, blurb: "Outreach and bookings" },
  { to: "/ideas", label: "Idea engine", icon: Lightbulb, blurb: "Concepts in one tap" },
];

/** Dashboard — the plan at a glance. */
export default function Dashboard() {
  const { activeEvent, loading: loadingEvent } = useEvent();
  const data = useDashboardData(activeEvent?.id);
  const currency = activeEvent?.currency || "INR";

  const handleToggle = async (task) => {
    const wasOpen = task.status !== "done";
    await data.toggleTask(task);
    if (wasOpen) celebrateSmall();
  };

  if (loadingEvent) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-64 rounded-[28px]" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-3xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-3xl" />
      </div>
    );
  }

  if (!activeEvent) return <WelcomeEmpty />;

  if (data.loading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-64 rounded-[28px]" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-3xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-3xl" />
      </div>
    );
  }

  if (data.error) {
    return (
      <div role="alert" className="rounded-3xl bg-destructive/10 p-6">
        <h1 className="font-display text-xl text-destructive">I couldn't load your plan just now</h1>
        <p className="mt-1 text-sm text-foreground">{data.error}</p>
        <button
          type="button"
          onClick={data.reload}
          className="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Try again
        </button>
      </div>
    );
  }

  const { taskTotals, guestTotals, vendorTotals, categories, spendTotal } = data;
  const score = planningScore({
    tasksDone: taskTotals.done,
    tasksTotal: taskTotals.total,
    vendorPoints: data.vendorPoints,
    vendorMax: data.vendorMax,
    categoriesLogged: categories.filter((c) => (data.spendByCategory[c.category] || 0) > 0).length,
    categoriesTotal: categories.length,
  });

  const budgetTotal = Number(activeEvent.budget_total) || 0;
  const remaining = budgetTotal - spendTotal;
  const bookedVendors = vendorTotals.booked + vendorTotals.paid;
  const overspent = remaining < 0;

  const tiles = [
    {
      label: "Budget left",
      value: formatCompact(Math.abs(remaining), currency),
      hint: overspent
        ? `over budget by ${formatMoney(Math.abs(remaining), currency)}`
        : `of ${formatMoney(budgetTotal, currency)}`,
      warn: overspent,
      icon: Wallet,
    },
    {
      label: "Tasks done",
      value: `${taskTotals.done}/${taskTotals.total || 0}`,
      hint: taskTotals.total - taskTotals.done === 0 ? "all clear" : `${taskTotals.total - taskTotals.done} to go`,
      icon: CheckCircle2,
    },
    {
      label: "Guests confirmed",
      value: `${guestTotals.confirmed}`,
      hint: `${guestTotals.pending} waiting on a reply`,
      icon: Users,
    },
    {
      label: "Vendors booked",
      value: `${bookedVendors}/${data.vendorCount}`,
      hint: `${vendorTotals.researching} still to research`,
      icon: ShieldCheck,
    },
  ];
  return (
    <div className="space-y-5">
      <EventHero event={activeEvent} score={score} currency={currency} />

      <StatGrid tiles={tiles} />

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="rounded-3xl bg-card p-4 shadow-soft ring-hairline sm:p-5">
            <h2 className="font-display text-lg text-foreground">Where the money is going</h2>
            <div className="mt-4">
              <BudgetDonut
                categories={categories}
                spendByCategory={data.spendByCategory}
                spendTotal={spendTotal}
                currency={currency}
              />
            </div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <UpcomingTasks tasks={data.tasks} onToggle={handleToggle} />
        </div>
      </div>

      <section aria-label="Quick actions" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {QUICK_LINKS.map(({ to, label, icon: Icon, blurb }) => (
          <Link
            key={to}
            to={to}
            className="group rounded-3xl bg-card p-4 shadow-soft ring-hairline transition hover:-translate-y-0.5 hover:shadow-lift"
          >
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-secondary text-primary" aria-hidden="true">
              <Icon className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-semibold text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">{blurb}</p>
          </Link>
        ))}
      </section>

      {data.vendorCount > 0 && vendorTotals.researching > 0 ? (
        <p className="flex items-center gap-2 rounded-2xl bg-secondary/70 px-4 py-3 text-sm text-secondary-foreground">
          <Sparkles className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          You still haven't reached {vendorTotals.researching} vendor category
          {vendorTotals.researching === 1 ? "" : "ies"} — open Vendors and I'll draft the messages for you.
        </p>
      ) : null}
    </div>
  );
}