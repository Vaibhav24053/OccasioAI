import { cn } from "@/lib/utils";

/** Friendly, non-dead-end empty state used across every screen. */
export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-card/60 px-6 py-12 text-center",
        className,
      )}
    >
      {Icon ? (
        <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-primary">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
      ) : null}
      <h3 className="font-display text-xl text-foreground">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}