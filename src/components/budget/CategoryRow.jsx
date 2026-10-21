import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { categoryHealth } from "@/lib/budget";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

const BAR_STYLES = {
  ok: "bg-primary",
  watch: "bg-gold",
  over: "bg-destructive",
  empty: "bg-border",
};

/** One budget line: allocated vs spent, with the allocation editable. */
export default function CategoryRow({ category, spent = 0, currency = "INR", onSaveAllocation }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(String(category.allocated ?? 0));
  const { pct, state } = categoryHealth(category.allocated, spent);
  const remaining = (Number(category.allocated) || 0) - spent;

  const save = async () => {
    await onSaveAllocation(category, Math.max(0, Number(draft) || 0));
    setOpen(false);
  };

  return (
    <li className="rounded-2xl px-3 py-3 transition hover:bg-secondary/40">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 truncate text-sm font-semibold text-foreground">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: category.color }} aria-hidden="true" />
            {category.label}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatMoney(spent, currency)} of {formatMoney(category.allocated, currency)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums",
              state === "over" ? "bg-destructive/10 text-destructive" : "bg-secondary text-secondary-foreground",
            )}
          >
            {remaining < 0
              ? `${formatMoney(Math.abs(remaining), currency)} over`
              : `${formatMoney(remaining, currency)} left`}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setDraft(String(category.allocated ?? 0));
              setOpen(true);
            }}
            aria-label={`Edit the allocation for ${category.label}`}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuenow={Math.min(pct, 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${category.label} ${pct}% used`}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-500", BAR_STYLES[state])}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Allocation for {category.label}</DialogTitle>
          </DialogHeader>
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label="Allocated amount"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  );
}