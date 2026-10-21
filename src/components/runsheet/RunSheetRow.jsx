import { Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatClock } from "@/lib/format";
import { cn } from "@/lib/utils";

/** One minute-by-minute line in the day-of schedule. */
export default function RunSheetRow({ item, onToggle, onDelete }) {
  return (
    <li className="flex items-start gap-3 py-3">
      <div className="w-20 shrink-0 pt-0.5 text-right">
        <p className="text-sm font-semibold tabular-nums text-foreground">{formatClock(item.start_time)}</p>
        {item.duration_minutes ? (
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{item.duration_minutes} min</p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => onToggle(item)}
        role="checkbox"
        aria-checked={Boolean(item.done)}
        aria-label={`Mark “${item.activity}” as ${item.done ? "not done" : "done"}`}
        className={cn(
          "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition",
          item.done ? "border-primary bg-primary text-white" : "border-primary/40 text-transparent hover:border-primary",
        )}
      >
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium text-foreground", item.done && "text-muted-foreground line-through")}>
          {item.activity}
        </p>
        {item.owner ? <p className="text-xs text-muted-foreground">Owner: {item.owner}</p> : null}
        {item.notes ? <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{item.notes}</p> : null}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-muted-foreground"
        onClick={() => onDelete(item)}
        aria-label={`Delete ${item.activity}`}
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>
    </li>
  );
}