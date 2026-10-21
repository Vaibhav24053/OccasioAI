import moment from "moment";

/** Currency symbols we support in the intake flow. */
export const CURRENCIES = [
  { value: "INR", label: "₹ INR" },
  { value: "USD", label: "$ USD" },
  { value: "EUR", label: "€ EUR" },
  { value: "GBP", label: "£ GBP" },
  { value: "AED", label: "AED" },
];

const SYMBOLS = { INR: "₹", USD: "$", EUR: "€", GBP: "£", AED: "AED " };

export function currencySymbol(currency = "INR") {
  return SYMBOLS[currency] || "";
}

/** "₹1,50,000" — full money label. */
export function formatMoney(amount, currency = "INR") {
  const value = Math.round(Number(amount) || 0);
  return `${currencySymbol(currency)}${value.toLocaleString("en-IN")}`;
}

/** "₹1.5L" — compact money label for tiles and charts. */
export function formatCompact(amount, currency = "INR") {
  const value = Math.round(Number(amount) || 0);
  const symbol = currencySymbol(currency);
  if (Math.abs(value) >= 10000000) return `${symbol}${(value / 10000000).toFixed(1)}Cr`;
  if (Math.abs(value) >= 100000) return `${symbol}${(value / 100000).toFixed(1)}L`;
  if (Math.abs(value) >= 1000) return `${symbol}${(value / 1000).toFixed(1)}k`;
  return `${symbol}${value}`;
}

export function formatDate(date, fmt = "DD MMM YYYY") {
  if (!date) return "Date to be decided";
  return moment(date).format(fmt);
}

export function formatDateLong(date) {
  return formatDate(date, "dddd, D MMMM YYYY");
}

/** Whole days from today until `date` (negative once past). */
export function daysUntil(date) {
  if (!date) return null;
  return moment(date).startOf("day").diff(moment().startOf("day"), "days");
}

/** Live countdown pieces for the dashboard widget. */
export function countdownParts(date) {
  if (!date) return { days: 0, hours: 0, minutes: 0, seconds: 0, past: true, total: 0 };
  const target = moment(date).endOf("day");
  const diff = target.diff(moment());
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, past: true, total: 0 };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    past: false,
    total: diff,
  };
}

/** "in 12 days" / "3 days late" for task rows. */
export function dueLabel(dueDate) {
  const days = daysUntil(dueDate);
  if (days === null) return "";
  if (days === 0) return "due today";
  if (days === 1) return "due tomorrow";
  if (days > 1) return `in ${days} days`;
  if (days === -1) return "1 day late";
  return `${Math.abs(days)} days late`;
}

/** "16:30" → "4:30 PM". Passes through anything it can't parse. */
export function formatClock(value) {
  if (!value) return "";
  const parsed = moment(value, ["HH:mm", "H:mm", "HH:mm:ss", "h:mm A"], true);
  return parsed.isValid() ? parsed.format("h:mm A") : value;
}

export function todayISO() {
  return moment().format("YYYY-MM-DD");
}