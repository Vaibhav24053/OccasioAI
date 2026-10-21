/** Consistent page title block: eyebrow, title, subtitle and right-side actions. */
export default function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
        ) : null}
        <h1 className="font-display text-3xl leading-tight text-foreground sm:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}