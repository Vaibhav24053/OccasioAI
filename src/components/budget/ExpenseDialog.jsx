import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { currencySymbol, todayISO } from "@/lib/format";

/** Log a real expense against a budget category. */
export default function ExpenseDialog({ open, onOpenChange, eventId, categories, currency = "INR", onSaved }) {
  const [form, setForm] = useState({
    category: categories[0]?.category || "venue",
    amount: "",
    description: "",
    paid_to: "",
    expense_date: todayISO(),
  });
  const [busy, setBusy] = useState(false);

  const set = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await base44.entities.Expense.create({
        event_id: eventId,
        category: form.category,
        amount: Number(form.amount) || 0,
        description: form.description,
        paid_to: form.paid_to,
        expense_date: form.expense_date,
      });
      setForm((prev) => ({ ...prev, amount: "", description: "", paid_to: "" }));
      await onSaved?.();
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log an expense</DialogTitle>
          <DialogDescription>Real spend updates every category bar and the donut.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="expense-category">Category</Label>
            <select
              id="expense-category"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className="mt-1.5 h-11 w-full rounded-2xl border border-input bg-background px-3 text-sm"
            >
              {categories.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="expense-amount">Amount ({currencySymbol(currency)})</Label>
              <Input
                id="expense-amount"
                type="number"
                min={0}
                inputMode="numeric"
                required
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="expense-date">Date</Label>
              <Input
                id="expense-date"
                type="date"
                value={form.expense_date}
                onChange={(e) => set("expense_date", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="expense-what">What was it for?</Label>
            <Input
              id="expense-what"
              placeholder="Deposit for the banquet hall"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="expense-to">Paid to (optional)</Label>
            <Input
              id="expense-to"
              placeholder="Rambagh Palace"
              value={form.paid_to}
              onChange={(e) => set("paid_to", e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || !form.amount}>
              {busy ? "Saving…" : "Save expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}