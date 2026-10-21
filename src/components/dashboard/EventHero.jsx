import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, MapPin, PiggyBank, Users } from "lucide-react";
import CountdownTimer from "@/components/CountdownTimer";
import PlanningScore from "@/components/PlanningScore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { daysUntil, formatCompact, formatDateLong } from "@/lib/format";
import { EVENT_TYPES, budgetPerGuest, isTightBudget } from "@/lib/budget";
import { isEmergency } from "@/lib/plan-metrics";

/** The emotional centre of the dashboard: the big day, the countdown, the score. */
export default function EventHero({ event, score, currency }) {
  if (!event) return null;
  const days = daysUntil(event.event_date);
  const emoji = EVENT_TYPES.find((t) => t.value === event.event_type)?.emoji || "✨";
  const emergency = isEmergency(event.event_date);
  const tight = isTightBudget(event);

  return (
    <section className="relative overflow-hidden rounded-[28px] bg-card p-5 shadow-soft ring-hairline sm:p-8">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1.5 gradient-brand"
        aria-hidden="true"
      />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full text-xs">
              <span className="mr-1" aria-hidden="true">{emoji}</span>
              {days === null ? "Date to be decided" : days > 0 ? `T-minus ${days} day${days === 1 ? "" : "s"}` : "It's today!"}
            </Badge>
            {emergency ? (
              <Badge className="rounded-full bg-destructive/10 text-destructive hover:bg-destructive/10">
                <AlertTriangle className="mr-1 h-3 w-3" aria-hidden="true" /> Emergency mode
              </Badge>
            ) : null}
            {tight ? (
              <Badge className="rounded-full bg-gold/20 text-foreground hover:bg-gold/20">
                <PiggyBank className="mr-1 h-3 w-3" aria-hidden="true" /> DIY hero plan
              </Badge>
            ) : null}
          </div>

          <h1 className="mt-3 truncate font-display text-3xl leading-tight text-foreground sm:text-5xl">
            {event.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{formatDateLong(event.event_date)}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {event.city ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" aria-hidden="true" /> {event.city}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4" aria-hidden="true" /> {event.guest_count ?? "?"} guests
            </span>
            <span className="inline-flex items-center gap-1.5">
              <PiggyBank className="h-4 w-4" aria-hidden="true" /> {formatCompact(event.budget_total, currency)} total ·{" "}
              {formatCompact(budgetPerGuest(event), currency)}/guest
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:w-[340px] lg:shrink-0">
          <CountdownTimer date={event.event_date} />
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-secondary/60 px-4 py-3">
            <PlanningScore score={score} />
            <Button asChild variant="ghost" size="sm" className="shrink-0 rounded-full">
              <Link to="/timeline">
                Tasks <ArrowRight className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {event.summary ? (
        <p className="mt-6 border-t border-border pt-5 text-sm leading-relaxed text-muted-foreground">
          {event.summary}
        </p>
      ) : null}
    </section>
  );
}