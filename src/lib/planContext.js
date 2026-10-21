import { categoryLabel, isTightBudget, vendorStatusIndex } from "@/lib/budget";
import { daysUntil } from "@/lib/format";

/**
 * Turns a user's plan into the compact brief we hand to the AI. Every AI reply
 * in the app reasons over this, so the numbers it quotes are the real ones.
 */
export function buildPlanContext({ event, categories = [], expenses = [], tasks = [], vendors = [], guests = [], runSheet = [] }) {
  if (!event) return "No event plan loaded yet.";

  const currency = event.currency || "INR";
  const total = Number(event.budget_total) || 0;
  const spent = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const days = daysUntil(event.event_date);

  const lines = [];
  lines.push(`EVENT BRIEF`);
  lines.push(`- Occasion: ${event.occasion_name || event.name} (${event.event_type})`);
  lines.push(`- Date: ${event.event_date}${days !== null ? ` — ${days} days from today` : ""}`);
  lines.push(`- City: ${event.city || "not set"} · Venue preference: ${event.venue_preference || "not set"}`);
  lines.push(`- Guests planned: ${event.guest_count ?? "unknown"} · Venue capacity estimate: ${event.venue_capacity ?? "unknown"}`);
  lines.push(`- Theme/vibe: ${event.theme || "not set"} · Culture: ${event.culture || "not set"}`);
  lines.push(`- Budget: ${currency} ${total} (${event.budget_flexibility || "flexibility not stated"})`);
  lines.push(`- Spent so far: ${currency} ${spent} (${total > 0 ? Math.round((spent / total) * 100) : 0}% of budget)`);
  lines.push(`- Must-haves: ${event.must_haves || "none stated"}`);
  lines.push(`- Absolute no-gos: ${event.no_gos || "none stated"}`);
  if (isTightBudget(event)) lines.push(`- NOTE: this is a very tight budget — always suggest low-cost/DIY options first.`);
  if (days !== null && days >= 0 && days < 7) lines.push(`- NOTE: the event is less than a week away — give compressed, urgent advice.`);

  if (categories.length) {
    lines.push(`BUDGET ALLOCATION`);
    categories.forEach((c) => {
      const catSpent = expenses
        .filter((e) => e.category === c.category)
        .reduce((s, e) => s + (Number(e.amount) || 0), 0);
      lines.push(`- ${c.label || categoryLabel(c.category)}: allocated ${currency} ${c.allocated}, spent ${currency} ${catSpent}`);
    });
  }

  const openTasks = tasks.filter((t) => t.status !== "done");
  lines.push(`TASKS: ${tasks.length - openTasks.length} done, ${openTasks.length} open`);
  openTasks.slice(0, 12).forEach((t) => {
    lines.push(`- [open] ${t.title} (due ${t.due_date}${t.priority ? `, ${t.priority} priority` : ""})`);
  });

  if (vendors.length) {
    lines.push(`VENDORS`);
    vendors.forEach((v) => {
      const status = v.status || "researching";
      lines.push(
        `- ${v.category_label || v.category}: ${v.name || "not chosen yet"}, status ${status}, quoted ${v.quoted_price ? `${currency} ${v.quoted_price}` : "nothing yet"}, budget ${v.budget_allocated ? `${currency} ${v.budget_allocated}` : "unset"}`,
      );
    });
    const booked = vendors.filter((v) => vendorStatusIndex(v.status) >= 2).length;
    lines.push(`- Booked or paid so far: ${booked} of ${vendors.length}`);
  }

  if (guests.length) {
    const confirmed = guests.filter((g) => g.rsvp_status === "confirmed");
    const heads = confirmed.reduce((s, g) => s + 1 + (Number(g.plus_ones) || 0), 0);
    lines.push(`GUESTS: ${guests.length} invited, ${confirmed.length} confirmed (≈${heads} seats)`);
  }

  if (runSheet.length) {
    lines.push(`RUN SHEET (${runSheet.length} items)`);
    runSheet.slice(0, 10).forEach((r) => lines.push(`- ${r.start_time || ""} ${r.activity}`));
  }

  return lines.join("\n");
}