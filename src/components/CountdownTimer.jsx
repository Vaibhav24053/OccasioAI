import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { countdownParts } from "@/lib/format";

const UNITS = [
  { key: "days", label: "days" },
  { key: "hours", label: "hrs" },
  { key: "minutes", label: "min" },
  { key: "seconds", label: "sec" },
];

/** Live T-minus countdown to the event date. Ticks once a second. */
export default function CountdownTimer({ date, className }) {
  const [parts, setParts] = useState(() => countdownParts(date));

  useEffect(() => {
    setParts(countdownParts(date));
    const id = setInterval(() => setParts(countdownParts(date)), 1000);
    return () => clearInterval(id);
  }, [date]);

  if (!date) return null;

  if (parts.past) {
    return (
      <div className={cn("rounded-2xl bg-card/70 px-4 py-3 text-sm font-semibold text-primary", className)}>
        The big day is here — go celebrate! 🎉
      </div>
    );
  }

  return (
    <div className={cn("flex items-stretch gap-2", className)} role="timer" aria-label="Time until the event">
      {UNITS.map((unit) => (
        <div
          key={unit.key}
          className="min-w-[58px] flex-1 rounded-2xl bg-card/70 px-2 py-3 text-center backdrop-blur-sm ring-hairline"
        >
          <div className="font-display text-2xl leading-none tabular-nums text-foreground">
            {String(parts[unit.key]).padStart(2, "0")}
          </div>
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {unit.label}
          </div>
        </div>
      ))}
    </div>
  );
}