import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RSVP_STATUS } from "@/lib/budget";

/** Add one guest, or paste a whole list at once. */
export default function GuestDialog({ open, onOpenChange, eventId, guest, onSaved }) {
  const editing = Boolean(guest?.id);
  const [mode, setMode] = useState("one");
  const [bulk, setBulk] = useState("");
  const [form, setForm] = useState(() => ({
    name: guest?.name || "",
    email: guest?.email || "",
    phone: guest?.phone || "",
    household: guest?.household || "",
    side: guest?.side || "",
    plus_ones: guest?.plus_ones ?? 0,
    rsvp_status: guest?.rsvp_status || "pending",
    dietary: guest?.dietary || "",
    notes: guest?.notes || "",
  }));
  const [busy, setBusy] = useState(false);

  const set = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "bulk" && !editing) {
        const names = bulk
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);
        if (names.length) {
          await base44.entities.Guest.bulkCreate(
            names.map((name) => ({ event_id: eventId, name, rsvp_status: "pending" })),
          );
        }
      } else if (editing) {
        await base44.entities.Guest.update(guest.id, {
          ...form,
          plus_ones: Number(form.plus_ones) || 0,
        });
      } else {
        await base44.entities.Guest.create({
          ...form,
          event_id: eventId,
          plus_ones: Number(form.plus_ones) || 0,
        });
      }
      await onSaved?.();
      onOpenChange(false);
      setBulk("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Guest details" : "Add guests"}</DialogTitle>
          <DialogDescription>Headcount feeds the catering and seating estimates.</DialogDescription>
        </DialogHeader>

        {!editing ? (
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "one" ? "default" : "secondary"}
              size="sm"
              className="rounded-full"
              onClick={() => setMode("one")}
            >
              One guest
            </Button>
            <Button
              type="button"
              variant={mode === "bulk" ? "default" : "secondary"}
              size="sm"
              className="rounded-full"
              onClick={() => setMode("bulk")}
            >
              Paste a list
            </Button>
          </div>
        ) : null}

        <form onSubmit={submit} className="space-y-4">
          {mode === "bulk" && !editing ? (
            <div>
              <Label htmlFor="guest-bulk">One name per line</Label>
              <Textarea
                id="guest-bulk"
                rows={6}
                value={bulk}
                onChange={(e) => setBulk(e.target.value)}
                placeholder={"Anita Sharma\nRohit Sharma\nPriya's family (4)"}
              />
              <p className="mt-1.5 text-xs text-muted-foreground">Everyone lands as “awaiting reply”.</p>
            </div>
          ) : (
            <>
              <div>
                <Label htmlFor="guest-name">Name</Label>
                <Input id="guest-name" required value={form.name} onChange={(e) => set("name", e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="guest-phone">Phone</Label>
                  <Input id="guest-phone" inputMode="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="guest-plus">Plus ones</Label>
                  <Input
                    id="guest-plus"
                    type="number"
                    min={0}
                    value={form.plus_ones}
                    onChange={(e) => set("plus_ones", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="guest-household">Household</Label>
                  <Input id="guest-household" value={form.household} onChange={(e) => set("household", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="guest-side">Side</Label>
                  <Input
                    id="guest-side"
                    placeholder="bride's family"
                    value={form.side}
                    onChange={(e) => set("side", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="guest-rsvp">RSVP</Label>
                <select
                  id="guest-rsvp"
                  value={form.rsvp_status}
                  onChange={(e) => set("rsvp_status", e.target.value)}
                  className="h-11 w-full rounded-2xl border border-input bg-background px-3 text-sm"
                >
                  {RSVP_STATUS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="guest-dietary">Dietary notes</Label>
                <Input
                  id="guest-dietary"
                  placeholder="Jain, no onion garlic"
                  value={form.dietary}
                  onChange={(e) => set("dietary", e.target.value)}
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || (mode === "bulk" && !editing && !bulk.trim())}>
              {busy ? "Saving…" : "Save guests"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}