import { Mail, MessageSquareQuote, Pencil, Phone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categoryHealth, VENDOR_STATUS } from "@/lib/budget";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

/** One vendor category: who's chosen, where they are in the pipeline, what they cost. */
export default function VendorCard({ vendor, currency = "INR", onStatusChange, onEdit, onDraft, onDelete, onEmail }) {
  const quoted = Number(vendor.quoted_price) || 0;
  const allocated = Number(vendor.budget_allocated) || 0;
  const { pct, state } = categoryHealth(allocated, quoted);
  const overBudget = allocated > 0 && quoted > allocated;
  const currentIndex = VENDOR_STATUS.findIndex((s) => s.value === (vendor.status || "researching"));

  return (
    <article className="rounded-3xl bg-card p-4 shadow-soft ring-hairline sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg capitalize text-foreground">
            {vendor.category_label || vendor.category}
          </h3>
          <p className="truncate text-sm text-muted-foreground">
            {vendor.name || "No vendor chosen yet"}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary"
            onClick={() => onEmail(vendor)}
            disabled={!vendor.email}
            title={vendor.email ? `Email ${vendor.name || vendor.category_label || vendor.category} for a quote` : "Save an email address for this vendor first"}
            aria-label={`Request a quote from ${vendor.category_label || vendor.category}`}
          >
            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(vendor)} aria-label={`Edit ${vendor.category}`}>
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={() => onDelete(vendor)}
            aria-label={`Delete ${vendor.category}`}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {vendor.why ? <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{vendor.why}</p> : null}

      {/* pipeline */}
      <ol className="mt-4 flex items-center gap-1" aria-label="Vendor status">
        {VENDOR_STATUS.map((step, index) => (
          <li key={step.value} className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => onStatusChange(vendor, step.value)}
              aria-current={index === currentIndex}
              className="group w-full text-left"
            >
              <span
                className={cn(
                  "block h-1.5 w-full rounded-full transition",
                  index <= currentIndex ? "gradient-brand" : "bg-secondary group-hover:bg-secondary/70",
                )}
                aria-hidden="true"
              />
              <span
                className={cn(
                  "mt-1 block truncate text-[10px] font-semibold uppercase tracking-wide",
                  index <= currentIndex ? "text-primary" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </button>
          </li>
        ))}
      </ol>

      {allocated > 0 || quoted > 0 ? (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Quote {quoted ? formatMoney(quoted, currency) : "—"} · budget {allocated ? formatMoney(allocated, currency) : "unset"}
            </span>
            <span className={cn("font-semibold tabular-nums", overBudget ? "text-destructive" : "text-muted-foreground")}>
              {allocated > 0 ? `${pct}%` : ""}
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
            <div
              className={cn("h-full rounded-full transition-all", state === "over" ? "bg-destructive" : state === "watch" ? "bg-gold" : "bg-primary")}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          {overBudget ? (
            <p className="mt-1.5 text-xs font-medium text-destructive">
              {formatMoney(quoted - allocated, currency)} above what you set aside for this.
            </p>
          ) : null}
        </div>
      ) : null}

      {(vendor.phone || vendor.email) ? (
        <div className="mt-4 space-y-1 text-xs text-muted-foreground">
          {vendor.contact_name ? <p>Contact: {vendor.contact_name}</p> : null}
          {vendor.phone ? (
            <p className="inline-flex items-center gap-1.5">
              <Phone className="h-3 w-3" aria-hidden="true" /> {vendor.phone}
            </p>
          ) : null}
          {vendor.email ? (
            <p className="inline-flex items-center gap-1.5">
              <Mail className="h-3 w-3" aria-hidden="true" /> {vendor.email}
            </p>
          ) : null}
        </div>
      ) : null}

      <Button variant="secondary" className="mt-4 w-full rounded-full" onClick={() => onDraft(vendor)}>
        <MessageSquareQuote className="mr-2 h-4 w-4" aria-hidden="true" />
        Write my message
      </Button>
    </article>
  );
}