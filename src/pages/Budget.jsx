import { useCallback, useEffect, useState } from "react";
import { PiggyBank, Plus, Receipt, Sparkles, Trash2, Wallet } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useEvent } from "@/lib/EventContext";
import PageHeader from "@/components/PageHeader";
import StatGrid from "@/components/dashboard/StatGrid";
import BudgetDonut from "@/components/dashboard/BudgetDonut";
import CategoryRow from "@/components/budget/CategoryRow";
import ExpenseDialog from "@/components/budget/ExpenseDialog";
import RebalancePanel from "@/components/budget/RebalancePanel";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { showUndo } from "@/lib/feedback";
import { budgetPerGuest, isTightBudget, categoryLabel } from "@/lib/budget";
import { formatMoney } from "@/lib/format";

const DIY_TIPS = [
  "Move the money to food and photos — guests remember those, not the centrepieces.",
  "Home or community-hall venue with a hired decorator costs a fraction of a banquet.",
  "One live musician for the key hour beats a full band for four.",
  "Skip printed invites for a designed WhatsApp card; spend the saving on dessert.",
];

/** Budget engine: split, live tracker, overshoot warnings, AI rebalance. */
export default function Budget() {
  const { activeEvent, patchEvent } = useEvent();
  const { toast } = useToast();
  const [state, setState] = useState({ loading: true, categories: [], expenses: [], spendByCategory: {}, spendTotal: 0 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const currency = activeEvent?.currency || "INR";

  const load = useCallback(async () => {
    if (!activeEvent?.id) return;
    const [categories, spend, expenses] = await Promise.all([
      base44.entities.BudgetCategory.filter({ event_id: activeEvent.id }, { sort: "sort_order", limit: 50 }),
      base44.entities.Expense.aggregate({ query: { event_id: activeEvent.id }, groupBy: "category", sum: ["amount"] }),
      base44.entities.Expense.filter({ event_id: activeEvent.id }, { sort: "-expense_date", limit: 40 }),
    ]);
    const rows = spend.rows ?? [];
    setState({
      loading: false,
      categories: categories.items ?? [],
      expenses: expenses.items ?? [],
      spendByCategory: Object.fromEntries(rows.map((r) => [r.category, Number(r.sum_amount) || 0])),
      spendTotal: rows.reduce((sum, r) => sum + (Number(r.sum_amount) || 0), 0),
    });
  }, [activeEvent?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const saveAllocation = async (category, allocated) => {
    await base44.entities.BudgetCategory.update(category.id, { allocated });
    await load();
  };

  const deleteExpense = async (expense) => {
    await base44.entities.Expense.delete(expense.id);
    await load();
    const { id, ...rest } = expense;
    showUndo(toast, {
      title: "Expense removed",
      description: `${formatMoney(expense.amount, currency)} taken off ${categoryLabel(expense.category)}.`,
      undo: async () => {
        await base44.entities.Expense.create(rest);
        await load();
      },
    });
  };

  if (!activeEvent) {
    return (
      <EmptyState
        icon={Wallet}
        title="No event selected"
        description="Create an event first and your budget split appears here automatically."
        action={<Button asChild><a href="/onboarding">Plan an event</a></Button>}
      />
    );
  }

  if (state.loading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-16 rounded-3xl" />
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  const total = Number(activeEvent.budget_total) || 0;
  const remaining = total - state.spendTotal;
  const tight = isTightBudget(activeEvent);

  const tiles = [
    { label: "Total budget", value: formatMoney(total, currency), hint: activeEvent.budget_flexibility || "no flex noted", icon: PiggyBank },
    { label: "Spent", value: formatMoney(state.spendTotal, currency), hint: `${total ? Math.round((state.spendTotal / total) * 100) : 0}% of budget`, icon: Receipt },
    {
      label: remaining < 0 ? "Over budget" : "Still available",
      value: formatMoney(Math.abs(remaining), currency),
      hint: remaining < 0 ? "time to rebalance" : "including contingency",
      warn: remaining < 0,
      icon: Wallet,
    },
    { label: "Per guest", value: formatMoney(budgetPerGuest(activeEvent), currency), hint: `${activeEvent.guest_count || 0} guests`, icon: Sparkles },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Budget engine"
        title="Every rupee, accounted for"
        subtitle="Log what you actually spend and I'll warn you before a category runs away with the budget."
        actions={
          <Button onClick={() => setDialogOpen(true)} className="rounded-full gradient-brand text-white">
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Log expense
          </Button>
        }
      />

      {tight ? (
        <section className="rounded-3xl bg-gold/15 p-5">
          <h2 className="font-display text-lg text-foreground">DIY hero plan</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your budget is tight for {activeEvent.guest_count || "this many"} guests. Here's where the
            savings actually live:
          </p>
          <ul className="mt-3 space-y-2">
            {DIY_TIPS.map((tip) => (
              <li key={tip} className="flex gap-2 text-sm text-foreground">
                <span className="text-primary" aria-hidden="true">
                  •
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <StatGrid tiles={tiles} />

      <div className="grid gap-4 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <div className="rounded-3xl bg-card p-4 shadow-soft ring-hairline sm:p-5">
            <h2 className="font-display text-lg text-foreground">Categories</h2>
            <ul className="mt-2 divide-y divide-border/60">
              {state.categories.map((category) => (
                <CategoryRow
                  key={category.id}
                  category={category}
                  spent={state.spendByCategory[category.category] || 0}
                  currency={currency}
                  onSaveAllocation={saveAllocation}
                />
              ))}
            </ul>
          </div>
        </section>

        <div className="space-y-4 lg:col-span-2">
          <BudgetDonut
            categories={state.categories}
            spendByCategory={state.spendByCategory}
            spendTotal={state.spendTotal}
            currency={currency}
          />
          <RebalancePanel
            event={activeEvent}
            categories={state.categories}
            spendByCategory={state.spendByCategory}
            currency={currency}
            onApply={load}
          />
        </div>
      </div>

      <section className="rounded-3xl bg-card p-4 shadow-soft ring-hairline sm:p-5">
        <h2 className="font-display text-lg text-foreground">Expense log</h2>
        {state.expenses.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              icon={Receipt}
              title="Nothing logged yet"
              description="Add a deposit, a quote or a shopping receipt — the donut and every bar will update."
              action={<Button onClick={() => setDialogOpen(true)}>Log the first expense</Button>}
            />
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-border/60">
            {state.expenses.map((expense) => (
              <li key={expense.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {expense.description || categoryLabel(expense.category)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {categoryLabel(expense.category)}
                    {expense.expense_date ? ` · ${expense.expense_date}` : ""}
                    {expense.paid_to ? ` · ${expense.paid_to}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                  {formatMoney(expense.amount, currency)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground"
                  onClick={() => deleteExpense(expense)}
                  aria-label={`Delete expense ${expense.description || categoryLabel(expense.category)}`}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ExpenseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        eventId={activeEvent.id}
        categories={state.categories}
        currency={currency}
        onSaved={load}
      />
    </div>
  );
}