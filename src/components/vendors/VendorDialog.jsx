import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { VENDOR_STATUS } from "@/lib/budget";

/** Add a vendor category, or fill in the details of one already on the list. */
export default function VendorDialog({ open, onOpenChange, eventId, vendor, onSaved }) {
  const editing = Boolean(vendor?.id);
  const [form, setForm] = useState(() => ({
    category: vendor?.category || "",
    category_label: vendor?.category_label || "",
    name: vendor?.name || "",
    contact_name: vendor?.contact_name || "",
    phone: vendor?.phone || "",
    email: vendor?.email || "",
    quoted_price: vendor?.quoted_price ?? "",
    budget_allocated: vendor?.budget_allocated ?? "",
    status: vendor?.status || "researching",
    notes: vendor?.notes || "",
  }));
  const [busy, setBusy] = useState(false);

  const set = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        ...form,
        quoted_price: form.quoted_price === "" ? 0 : Number(form.quoted_price),
        budget_allocated: form.budget_allocated === "" ? 0 : Number(form.budget_allocated),
      };
      if (editing) await base44.entities.Vendor.update(vendor.id, payload);
      else
        await base44.entities.Vendor.create({
          ...payload,
          event_id: eventId,
          category: (form.category || form.category_label || "vendor").toLowerCase(),
        });
      await onSaved?.();
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Vendor details" : "Add a vendor category"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {!editing ? (
            <div>
              <Label htmlFor="vendor-category">What kind of vendor?</Label>
              <Input
                id="vendor-category"
                required
                placeholder="Choreographer"
                value={form.category_label}
                onChange={(e) => set("category_label", e.target.value)}
              />
            </div>
          ) : (
            <p className="text-sm font-semibold text-foreground">{vendor.category_label || vendor.category}</p>
          )}

          <div>
            <Label htmlFor="vendor-name">Business name</Label>
            <Input id="vendor-name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Sharma Caterers" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="vendor-contact">Contact person</Label>
              <Input id="vendor-contact" value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="vendor-phone">Phone</Label>
              <Input id="vendor-phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} inputMode="tel" />
            </div>
          </div>

          <div>
            <Label htmlFor="vendor-email">Email</Label>
            <Input id="vendor-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="vendor-quote">Quoted price</Label>
              <Input
                id="vendor-quote"
                type="number"
                min={0}
                inputMode="numeric"
                value={form.quoted_price}
                onChange={(e) => set("quoted_price", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="vendor-budget">Budget for this</Label>
              <Input
                id="vendor-budget"
                type="number"
                min={0}
                inputMode="numeric"
                value={form.budget_allocated}
                onChange={(e) => set("budget_allocated", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="vendor-status">Status</Label>
            <select
              id="vendor-status"
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className="h-11 w-full rounded-2xl border border-input bg-background px-3 text-sm"
            >
              {VENDOR_STATUS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="vendor-notes">Notes</Label>
            <Textarea
              id="vendor-notes"
              rows={2}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Quoted ₹85k for 150 plates, will confirm by Friday"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save vendor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}