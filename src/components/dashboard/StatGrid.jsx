import { cn } from "@/lib/utils";

/** Four headline numbers: money, tasks, guests, vendors. */
export default function StatGrid({ tiles }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <div key={tile.label} className="rounded-3xl bg-card p-4 shadow-soft ring-hairline">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {tile.label}
              </span>
              {Icon ? <Icon className="h-4 w-4 text-primary" aria-hidden="true" /> : null}
            </div>
            <p className="mt-2 font-display text-2xl leading-none text-foreground">{tile.value}</p>
            {tile.hint ? (
              <p className={cn("mt-1.5 text-xs leading-snug", tile.warn ? "text-destructive" : "text-muted-foreground")}>
                {tile.hint}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}