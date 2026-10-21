import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Emergency checklist line: rain plan, first aid, backup vendor contacts. */
export default function ContingencyItem({ item, onToggle }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onToggle(item)}
        role="checkbox"
        aria-checked={Boolean(item.done)}
        className="flex w-full items-start gap-3 rounded-2xl px-2 py-2.5 text-left transition hover:bg-secondary/40"
      >
        <span
          className={cn(
            "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition",
            item.done ? "border-primary bg-primary text-white" : "border-primary/40 text-transparent",
          )}
          aria-hidden="true"
        >
          <Check className="h-3 w-3" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            {item.category ? (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary-foreground">
                {item.category}
              </span>
            ) : null}
            <span className={cn("text-sm font-medium text-foreground", item.done && "text-muted-foreground line-through")}>
              {item.activity}
            </span>
          </span>
          {item.notes ? <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{item.notes}</span> : null}
        </span>
      </button>
    </li>
  );
}