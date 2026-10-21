import { useNavigate } from "react-router-dom";
import { Check, ChevronsUpDown, Plus, PartyPopper } from "lucide-react";
import { useEvent } from "@/lib/EventContext";
import { formatDate } from "@/lib/format";
import { EVENT_TYPES } from "@/lib/budget";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function eventEmoji(type) {
  return EVENT_TYPES.find((t) => t.value === type)?.emoji || "✨";
}

/** Switch between the plans you're working on, or start a new one. */
export default function EventSwitcher({ className }) {
  const { events, activeEvent, selectEvent, loading } = useEvent();
  const navigate = useNavigate();

  if (loading) {
    return <div className={cn("h-14 rounded-2xl bg-secondary/70 animate-shimmer", className)} aria-hidden="true" />;
  }

  if (!activeEvent) {
    return (
      <Button className="w-full justify-start gap-2 rounded-2xl" onClick={() => navigate("/onboarding")}>
        <Plus className="h-4 w-4" aria-hidden="true" /> Plan an event
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-3 rounded-2xl bg-card px-3 py-3 text-left transition hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
          aria-label="Switch event"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-base" aria-hidden="true">
            {eventEmoji(activeEvent.event_type)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-foreground">{activeEvent.name}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {formatDate(activeEvent.event_date, "D MMM YYYY")}
              {activeEvent.city ? ` · ${activeEvent.city}` : ""}
            </span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[260px]">
        <DropdownMenuLabel>Your events</DropdownMenuLabel>
        {events.map((event) => (
          <DropdownMenuItem key={event.id} onSelect={() => selectEvent(event.id)} className="gap-2">
            <span aria-hidden="true">{eventEmoji(event.event_type)}</span>
            <span className="min-w-0 flex-1 truncate">{event.name}</span>
            {event.id === activeEvent.id ? <Check className="h-4 w-4 text-primary" aria-hidden="true" /> : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate("/onboarding")} className="gap-2 text-primary">
          <PartyPopper className="h-4 w-4" aria-hidden="true" /> Plan a new event
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}