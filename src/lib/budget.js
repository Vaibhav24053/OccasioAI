/**
 * Budget brain — how OccasioAI splits a total across categories, and every
 * lookup the budget / vendor / timeline screens need.
 */

export const EVENT_TYPES = [
  { value: "wedding", label: "Wedding", emoji: "💍" },
  { value: "birthday", label: "Birthday", emoji: "🎂" },
  { value: "baby_shower", label: "Baby shower", emoji: "🍼" },
  { value: "corporate", label: "Corporate event", emoji: "💼" },
  { value: "community", label: "Community gathering", emoji: "🎪" },
  { value: "anniversary", label: "Anniversary", emoji: "🥂" },
  { value: "other", label: "Something else", emoji: "✨" },
];

export const THEMES = [
  { value: "elegant", label: "Elegant & timeless" },
  { value: "fun", label: "Fun & playful" },
  { value: "traditional", label: "Traditional & rooted" },
  { value: "minimalist", label: "Minimalist & calm" },
  { value: "fusion", label: "Fusion & bold" },
  { value: "glam", label: "Glam & dramatic" },
];

export const CULTURES = [
  { value: "indian", label: "Indian" },
  { value: "western", label: "Western" },
  { value: "mixed", label: "Mixed" },
  { value: "other", label: "Other" },
];

export const VENUE_PREFERENCES = [
  { value: "home", label: "At home" },
  { value: "banquet", label: "Banquet hall" },
  { value: "outdoor", label: "Outdoor / garden" },
  { value: "restaurant", label: "Restaurant" },
  { value: "hotel", label: "Hotel" },
  { value: "undecided", label: "Not decided yet" },
];

export const BUDGET_FLEXIBILITY = [
  { value: "strict", label: "Strict — can't go over" },
  { value: "stretch_10", label: "Can stretch ~10%" },
  { value: "flexible", label: "Quite flexible" },
];

export const DATE_FLEXIBILITY = [
  { value: "fixed", label: "Fixed date" },
  { value: "one_week", label: "Can shift ±1 week" },
  { value: "flexible", label: "Whole month is open" },
];

/** Every category the engine can use, with its chart colour. */
export const CATEGORY_META = {
  venue: { label: "Venue & rentals", color: "#7C5CFF" },
  catering: { label: "Catering & bar", color: "#F2739B" },
  decor: { label: "Decor & florals", color: "#E8B75C" },
  photography: { label: "Photo & video", color: "#4FC3B4" },
  entertainment: { label: "Entertainment", color: "#FF8A5B" },
  attire_beauty: { label: "Attire & beauty", color: "#A98BFF" },
  cake_desserts: { label: "Cake & desserts", color: "#FF9EC4" },
  invitations: { label: "Invitations & stationery", color: "#8FD4E8" },
  gifts_favors: { label: "Gifts & favours", color: "#F0C86A" },
  av_production: { label: "AV & production", color: "#6F8CFF" },
  permits_logistics: { label: "Permits & logistics", color: "#9BB068" },
  logistics: { label: "Logistics & rentals", color: "#9BB068" },
  contingency: { label: "Contingency buffer", color: "#C3BFD6" },
};

/** Category split per event type. Each row always totals 100%. */
const WEIGHTS = {
  wedding: { venue: 20, catering: 26, decor: 12, photography: 10, entertainment: 7, attire_beauty: 8, invitations: 3, gifts_favors: 4, contingency: 10 },
  birthday: { venue: 18, catering: 24, decor: 14, photography: 8, entertainment: 10, cake_desserts: 8, invitations: 3, gifts_favors: 5, contingency: 10 },
  baby_shower: { venue: 16, catering: 22, decor: 16, photography: 8, entertainment: 8, cake_desserts: 6, invitations: 4, gifts_favors: 10, contingency: 10 },
  corporate: { venue: 22, catering: 24, decor: 8, photography: 6, entertainment: 8, av_production: 10, invitations: 2, gifts_favors: 10, contingency: 10 },
  community: { venue: 14, catering: 30, decor: 10, photography: 6, entertainment: 16, permits_logistics: 8, invitations: 2, gifts_favors: 4, contingency: 10 },
  anniversary: { venue: 20, catering: 26, decor: 14, photography: 10, entertainment: 8, attire_beauty: 4, invitations: 3, gifts_favors: 5, contingency: 10 },
  other: { venue: 20, catering: 25, decor: 12, photography: 8, entertainment: 10, logistics: 7, invitations: 3, gifts_favors: 5, contingency: 10 },
};

export function categoryLabel(key) {
  return CATEGORY_META[key]?.label || key?.replace(/_/g, " ") || "Other";
}

export function categoryColor(key) {
  return CATEGORY_META[key]?.color || "#7C5CFF";
}

/**
 * Splits a total budget by event type. The last slice absorbs rounding so the
 * categories always add up to exactly the total.
 */
export function splitBudget(total, eventType = "other") {
  const weights = WEIGHTS[eventType] || WEIGHTS.other;
  const keys = Object.keys(weights);
  const amount = Math.max(0, Math.round(Number(total) || 0));
  let running = 0;

  return keys.map((key, index) => {
    const isLast = index === keys.length - 1;
    const allocated = isLast ? amount - running : Math.round((amount * weights[key]) / 100);
    running += allocated;
    return {
      category: key,
      label: categoryLabel(key),
      color: categoryColor(key),
      weight: weights[key],
      allocated,
      sort_order: index,
    };
  });
}

/** True when the plan has no real money to work with (₹0 or very thin per guest). */
export function isTightBudget(event) {
  if (!event) return false;
  const total = Number(event.budget_total) || 0;
  const guests = Math.max(1, Number(event.guest_count) || 1);
  if (total <= 0) return true;
  const perGuest = total / guests;
  const threshold = event.currency === "INR" ? 900 : 12;
  return perGuest < threshold;
}

export function budgetPerGuest(event) {
  if (!event) return 0;
  const guests = Math.max(1, Number(event.guest_count) || 1);
  return Math.round((Number(event.budget_total) || 0) / guests);
}

/** Health of one category, used for the progress bars. */
export function categoryHealth(allocated, spent) {
  const alloc = Number(allocated) || 0;
  const used = Number(spent) || 0;
  if (alloc <= 0) return { pct: used > 0 ? 100 : 0, state: used > 0 ? "over" : "empty" };
  const pct = Math.round((used / alloc) * 100);
  if (pct > 100) return { pct, state: "over" };
  if (pct >= 80) return { pct, state: "watch" };
  return { pct, state: "ok" };
}

/** Timeline phase for a task, derived from how early it is scheduled. */
export function phaseForDays(daysBefore) {
  const d = Number(daysBefore) || 0;
  if (d >= 90) return { key: "far", label: "3+ months out" };
  if (d >= 60) return { key: "two_months", label: "2–3 months out" };
  if (d >= 30) return { key: "month", label: "1–2 months out" };
  if (d >= 14) return { key: "weeks", label: "2–4 weeks out" };
  if (d >= 7) return { key: "fortnight", label: "Final 2 weeks" };
  if (d >= 1) return { key: "week", label: "Final week" };
  return { key: "day", label: "Event day" };
}

export const PHASE_ORDER = ["far", "two_months", "month", "weeks", "fortnight", "week", "day"];

export const VENDOR_STATUS = [
  { value: "researching", label: "Researching" },
  { value: "contacted", label: "Contacted" },
  { value: "booked", label: "Booked" },
  { value: "paid", label: "Paid" },
];

export function vendorStatusIndex(status) {
  const i = VENDOR_STATUS.findIndex((s) => s.value === status);
  return i < 0 ? 0 : i;
}

export const RSVP_STATUS = [
  { value: "pending", label: "Awaiting reply", color: "#C3BFD6" },
  { value: "confirmed", label: "Confirmed", color: "#4FC3B4" },
  { value: "declined", label: "Can't make it", color: "#F2739B" },
];

export const PRIORITY_META = {
  high: { label: "High", className: "bg-blush/15 text-blush-foreground" },
  medium: { label: "Medium", className: "bg-gold/20" },
  low: { label: "Low", className: "bg-muted" },
};

/** Fallback vendor checklist if the AI answer misses a category. */
export const VENDOR_FALLBACK = {
  wedding: ["caterer", "decorator", "photographer", "florist", "makeup artist", "band / DJ", "invitation designer", "priest / officiant"],
  birthday: ["caterer", "cake designer", "decorator", "DJ", "photographer", "balloon artist"],
  baby_shower: ["caterer", "decorator", "cake designer", "photographer", "entertainment", "favours supplier"],
  corporate: ["venue", "caterer", "AV technician", "photographer", "host / emcee", "gifting supplier"],
  community: ["caterer", "sound system", "decorator", "volunteer coordinator", "permit liaison"],
  anniversary: ["caterer", "decorator", "photographer", "live music", "cake designer"],
  other: ["caterer", "decorator", "photographer", "entertainment"],
};