import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatDate } from "@/lib/format";

/**
 * Moving the date cascades through the whole plan, so we say exactly what will
 * change — and which booked vendors it will affect — before doing it.
 */
export default function DateChangeDialog({ open, onOpenChange, event, bookedVendors = [], onConfirm }) {
  const [date, setDate] = useState(event?.event_date || "");
  const [regenerate, setRegenerate] = useState(true);
  const [busy, setBusy] = useState(false);

  const changed = date && date !== event?.event_date;

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm(date, regenerate, bookedVendors);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change the event date</DialogTitle>
          <DialogDescription>
            Currently {formatDate(event?.event_date)}. Every deadline shifts with the new date.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="new-date">New date</Label>
            <Input id="new-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <label className="flex items-start gap-3 text-sm text-foreground">
            <input
              type="checkbox"
              checked={regenerate}
              onChange={(e) => setRegenerate(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-input"
            />
            Rewrite my open tasks for the new timeline (completed tasks are kept)
          </label>

          {bookedVendors.length ? (
            <div className="rounded-2xl bg-gold/15 p-4 text-sm">
              <p className="flex items-center gap-2 font-semibold text-foreground">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                {bookedVendors.length} booked vendor{bookedVendors.length === 1 ? "" : "s"} affected
              </p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {bookedVendors.map((v) => (
                  <li key={v.id}>
                    {v.category_label || v.category}
                    {v.name ? ` — ${v.name}` : ""}
                    {v.phone ? ` · ${v.phone}` : ""}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">
                Call them to confirm the new date before anything else.
              </p>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={confirm} disabled={!changed || busy}>
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> Rescheduling…
              </>
            ) : (
              "Move the date"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}