import { scoreStage } from "@/lib/plan-metrics";
import { cn } from "@/lib/utils";

/** The "game progress bar" — how event-ready the plan is. */
export default function PlanningScore({ score = 0, className, compact = false }) {
  const stage = scoreStage(score);
  const circumference = 2 * Math.PI * 26;
  const dash = (score / 100) * circumference;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative grid h-16 w-16 shrink-0 place-items-center">
        <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90" aria-hidden="true">
          <circle cx="32" cy="32" r="26" fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
          <circle
            cx="32"
            cy="32"
            r="26"
            fill="none"
            stroke="url(#scoreGradient)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            className="transition-all duration-700 ease-out"
          />
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="hsl(258 88% 64%)" />
              <stop offset="60%" stopColor="hsl(320 78% 66%)" />
              <stop offset="100%" stopColor="hsl(38 78% 62%)" />
            </linearGradient>
          </defs>
        </svg>
        <span className="absolute font-display text-lg tabular-nums text-foreground">{score}</span>
      </div>
      {!compact ? (
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Planning score
          </p>
          <p className="truncate text-sm font-semibold text-foreground">
            {stage.emoji} {stage.label}
          </p>
        </div>
      ) : null}
    </div>
  );
}