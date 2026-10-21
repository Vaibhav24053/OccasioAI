import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RSVP_STATUS } from "@/lib/budget";
import { cn } from "@/lib/utils";

/** One guest with an inline RSVP control. */
export default function GuestRow({ guest, onRsvpChange, onEdit, onDelete }) {
  const status = RSVP_STATUS.find((s) => s.value === guest.rsvp_status) || RSVP_STATUS[0];

  return (
    <li className="flex flex-wrap items-center gap-3 py-3 sm:flex-nowrap">
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold text-white"
        style={{ background: status.color }}
        aria-hidden="true"
      >
        {guest.name?.slice(0, 1).toUpperCase()}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {guest.name}
          {guest.plus_ones ? (
            <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
              +{guest.plus_ones}
            </span>
          ) : null}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {[guest.household, guest.side, guest.phone, guest.dietary].filter(Boolean).join(" · ") || "no details yet"}
        </p>
      </div>

      <label className="sr-only" htmlFor={`rsvp-${guest.id}`}>
        RSVP for {guest.name}
      </label>
      <select
        id={`rsvp-${guest.id}`}
        value={guest.rsvp_status || "pending"}
        onChange={(e) => onRsvpChange(guest, e.target.value)}
        className={cn(
          "h-9 shrink-0 rounded-full border border-input bg-background px-3 text-xs font-semibold",
          guest.rsvp_status === "confirmed" && "text-primary",
          guest.rsvp_status === "declined" && "text-muted-foreground",
        )}
      >
        {RSVP_STATUS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <div className="flex shrink-0 gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(guest)} aria-label={`Edit ${guest.name}`}>
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          onClick={() => onDelete(guest)}
          aria-label={`Remove ${guest.name}`}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </li>
  );
}