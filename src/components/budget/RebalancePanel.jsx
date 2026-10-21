import { useState } from "react";
import { ArrowRight, Loader2, Scale, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";

/**
 * Asks the AI to move money between categories when something is overshooting,
 * and can apply the moves to the plan in one tap.
 */
export default function RebalancePanel({ event, categories, spendByCategory, currency = "INR", onApply }) {
  const [state, setState] = useState({ loading: false, data: null, error: null });
  const [applying, setApplying] = useState(false);

  const request = async () => {
    setState({ loading: true, data: null, error: null });
    try {
      const response = await base44.functions.invoke("rebalanceBudget", {
        event: {
          name: event.name,
          event_type: event.event_type,
          guest_count: event.guest_count,
          budget_total: event.budget_total,
          budget_flexibility: event.budget_flexibility,
          currency,
        },
        categories: categories.map((c) => ({
          category: c.category,
          label: c.label,
          allocated: c.allocated,
          spent: spendByCategory[c.category] || 0,
        })),
      });
      setState({ loading: false, data: response.data, error: null });
    } catch (e) {
      setState({ loading: false, data: null, error: e?.message || "The assistant is unreachable." });
    }
  };

  const apply = async () => {
    const suggestions = state.data?.suggestions || [];
    if (!suggestions.length) return;
    setApplying(true);
    try {
      const byCategory = Object.fromEntries(categories.map((c) => [c.category, Number(c.allocated) || 0]));
      suggestions.forEach((s) => {
        const amount = Number(s.amount) || 0;
        if (byCategory[s.from_category] === undefined || byCategory[s.to_category] === undefined) return;
        byCategory[s.from_category] = Math.max(0, byCategory[s.from_category] - amount);
        byCategory[s.to_category] = byCategory[s.to_category] + amount;
      });
      await base44.entities.BudgetCategory.bulkUpdate(
        categories.map((c) => ({ id: c.id, allocated: byCategory[c.category] })),
      );
      await onApply?.();
      setState((prev) => ({ ...prev, data: null }));
    } finally {
      setApplying(false);
    }
  };

  const labelFor = (key) => categories.find((c) => c.category === key)?.label || key;

  return (
    <div className="rounded-3xl bg-card p-5 shadow-soft ring-hairline">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg text-foreground">
            <Scale className="h-4 w-4 text-primary" aria-hidden="true" /> Smart rebalance
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            I'll look at where you're overshooting and suggest where to borrow from.
          </p>
        </div>
        <Button onClick={request} disabled={state.loading} className="shrink-0 rounded-full">
          {state.loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> thinking…
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" /> Suggest
            </>
          )}
        </Button>
      </div>

      {state.error ? (
        <p role="alert" className="mt-4 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      {state.data ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-medium text-foreground">{state.data.headline}</p>
          {(state.data.suggestions || []).map((s, i) => (
            <div key={i} className="rounded-2xl bg-secondary/70 px-4 py-3 text-sm">
              <p className="flex items-center gap-2 font-semibold text-secondary-foreground">
                {labelFor(s.from_category)}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                {labelFor(s.to_category)}
                <span className="ml-auto tabular-nums">{formatMoney(s.amount, currency)}</span>
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.reason}</p>
            </div>
          ))}
          {(state.data.warnings || []).map((w, i) => (
            <p key={i} className="rounded-2xl bg-gold/15 px-4 py-3 text-xs text-foreground">
              {w}
            </p>
          ))}
          {(state.data.suggestions || []).length ? (
            <Button variant="secondary" onClick={apply} disabled={applying} className="w-full rounded-full">
              {applying ? "Applying…" : "Apply these moves"}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}