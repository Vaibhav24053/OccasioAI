import { Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dueLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

const PRIORITY_STYLES = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-gold/20 text-foreground",
  low: "bg-secondary text-muted-foreground",
};

/** One timeline task, tickable and removable. */
export default function TaskRow({ task, onToggle, onDelete }) {
  const done = task.status === "done";
  const late = done
    ? task.completed_date && task.due_date && task.completed_date > task.due_date
    : dueLabel(task.due_date).includes("late");

  return (
    <li className="flex items-start gap-3 rounded-2xl px-2 py-3 transition hover:bg-secondary/40">
      <button
        type="button"
        onClick={() => onToggle(task)}
        role="checkbox"
        aria-checked={done}
        aria-label={`Mark “${task.title}” as ${done ? "not done" : "done"}`}
        className={cn(
          "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition",
          done
            ? "border-primary bg-primary text-white"
            : "border-primary/40 text-transparent hover:border-primary hover:bg-primary/10",
        )}
      >
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium leading-snug text-foreground", done && "text-muted-foreground line-through")}>
          {task.title}
        </p>
        {task.description ? (
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{task.description}</p>
        ) : null}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className={cn("text-xs", !done && late ? "text-destructive" : "text-muted-foreground")}>
            {done ? `done ${task.completed_date || ""}` : dueLabel(task.due_date)}
          </span>
          {late ? (
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">
              late
            </span>
          ) : null}
          {task.priority && task.priority !== "low" ? (
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", PRIORITY_STYLES[task.priority])}>
              {task.priority}
            </span>
          ) : null}
          {task.is_milestone ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              milestone
            </span>
          ) : null}
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-muted-foreground"
        onClick={() => onDelete(task)}
        aria-label={`Delete task ${task.title}`}
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>
    </li>
  );
}