import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { todayISO } from "@/lib/format";
import { vendorStatusIndex } from "@/lib/budget";

const EMPTY = {
  categories: [],
  spendByCategory: {},
  spendTotal: 0,
  tasks: [],
  taskTotals: { done: 0, total: 0 },
  guestTotals: { pending: 0, confirmed: 0, declined: 0 },
  vendorTotals: { researching: 0, contacted: 0, booked: 0, paid: 0 },
  vendorPoints: 0,
  vendorMax: 0,
  vendorCount: 0,
};

/**
 * Everything the dashboard needs for one event, in a single round of calls.
 * Numbers the server can answer cheaply are asked for as counts — only the
 * spend-by-category sum needs a grouping call.
 */
export function useDashboardData(eventId) {
  const [data, setData] = useState({ ...EMPTY, loading: true, error: null });

  const load = useCallback(async () => {
    if (!eventId) {
      setData({ ...EMPTY, loading: false, error: null });
      return;
    }

    try {
      const [categories, spend, tasks, taskTotal, taskDone, guestConfirmed, guestPending, vendorAgg] =
        await Promise.all([
          base44.entities.BudgetCategory.filter({ event_id: eventId }, { sort: "sort_order", limit: 50 }),
          base44.entities.Expense.aggregate({ query: { event_id: eventId }, groupBy: "category", sum: ["amount"] }),
          base44.entities.Task.filter({ event_id: eventId }, { sort: "due_date", limit: 200 }),
          base44.entities.Task.count({ event_id: eventId }),
          base44.entities.Task.count({ event_id: eventId, status: "done" }),
          base44.entities.Guest.count({ event_id: eventId, rsvp_status: "confirmed" }),
          base44.entities.Guest.count({ event_id: eventId, rsvp_status: "pending" }),
          base44.entities.Vendor.aggregate({ query: { event_id: eventId }, groupBy: "status" }),
        ]);

      const spendRows = spend.rows ?? [];
      const vendorRows = vendorAgg.rows ?? [];
      const pickCount = (key) => vendorRows.find((r) => r.status === key)?.count || 0;

      const vendorTotals = {
        researching: pickCount("researching"),
        contacted: pickCount("contacted"),
        booked: pickCount("booked"),
        paid: pickCount("paid"),
      };
      const vendorCount = vendorRows.reduce((sum, r) => sum + r.count, 0);

      setData({
        loading: false,
        error: null,
        categories: categories.items ?? [],
        spendByCategory: Object.fromEntries(spendRows.map((r) => [r.category, Number(r.sum_amount) || 0])),
        spendTotal: spendRows.reduce((sum, r) => sum + (Number(r.sum_amount) || 0), 0),
        tasks: tasks.items ?? [],
        taskTotals: { done: taskDone || 0, total: taskTotal || 0 },
        guestTotals: { confirmed: guestConfirmed || 0, pending: guestPending || 0, declined: 0 },
        vendorTotals,
        vendorPoints:
          vendorTotals.booked * 2 + vendorTotals.paid * 3 + vendorTotals.contacted * 1,
        vendorMax: vendorCount * 3,
        vendorCount,
      });
    } catch (error) {
      // Better to say we couldn't load than to quietly show zeroes.
      setData({ ...EMPTY, loading: false, error: error?.message || "Couldn't load your plan numbers." });
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  /** Tick a task off from the dashboard, or put it back. */
  const toggleTask = useCallback(
    async (task) => {
      const done = task.status === "done";
      await base44.entities.Task.update(task.id, {
        status: done ? "todo" : "done",
        completed_date: done ? null : todayISO(),
      });
      await load();
    },
    [load],
  );

  return { ...data, reload: load, toggleTask };
}