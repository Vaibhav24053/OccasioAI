import { Link } from "react-router-dom";
import { ArrowRight, CalendarCheck2, Check } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { dueLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

/** The next few things to do, tickable straight from the dashboard. */
export default function UpcomingTasks({ tasks = [], onToggle }) {
  const open = tasks.filter((t) => t.status !== "done").slice(0, 5);

  if (!open.length) {
    return (
      <EmptyState
        className="h-full"
        icon={CalendarCheck2}
        title="Nothing pressing"
        description="Every task in this phase is ticked off. Enjoy the calm."
      />
    );
  }

  return (
    <div className="rounded-3xl bg-card p-4 shadow-soft ring-hairline sm:p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-foreground">Next up</h2>
        <Link to="/timeline" className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
          Full timeline <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </div>
      <ul className="mt-3 space-y-1">
        {open.map((task) => {
          const late = dueLabel(task.due_date).includes("late");
          return (
            <li key={task.id} className="flex items-start gap-3 rounded-2xl px-2 py-2.5 transition hover:bg-secondary/60">
              <button
                type="button"
                onClick={() => onToggle?.(task)}
                aria-label={`Mark “${task.title}” as done`}
                className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-primary/40 text-transparent transition hover:border-primary hover:bg-primary/10 focus-visible:border-primary"
              >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug text-foreground">{task.title}</p>
                <p className={cn("text-xs", late ? "text-destructive" : "text-muted-foreground")}>
                  {dueLabel(task.due_date)}
                  {task.priority === "high" ? " · high priority" : ""}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}