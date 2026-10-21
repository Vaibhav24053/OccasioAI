import { daysUntil } from "@/lib/format";

/**
 * Planning-completion score (0–100), the "game progress bar" on the dashboard.
 * Weighted: tasks 55%, vendor progress 25%, budget logging 20%.
 */
export function planningScore({ tasksDone = 0, tasksTotal = 0, vendorPoints = 0, vendorMax = 0, categoriesLogged = 0, categoriesTotal = 0 }) {
  const taskPart = tasksTotal > 0 ? (tasksDone / tasksTotal) * 55 : 0;
  const vendorPart = vendorMax > 0 ? (vendorPoints / vendorMax) * 25 : 0;
  const budgetPart = categoriesTotal > 0 ? (categoriesLogged / categoriesTotal) * 20 : 0;
  return Math.max(0, Math.min(100, Math.round(taskPart + vendorPart + budgetPart)));
}

export const SCORE_STAGES = [
  { min: 0, label: "Just getting started", emoji: "🌱" },
  { min: 25, label: "Finding its shape", emoji: "🧭" },
  { min: 50, label: "Coming together", emoji: "🎈" },
  { min: 75, label: "Almost event-ready", emoji: "✨" },
  { min: 95, label: "Ready to celebrate", emoji: "🥳" },
];

export function scoreStage(score) {
  return [...SCORE_STAGES].reverse().find((s) => score >= s.min) || SCORE_STAGES[0];
}

/**
 * Emergency mode: an event that's happening within a week needs a compressed,
 * day-by-day plan instead of the normal long-range timeline.
 */
export function isEmergency(date) {
  const days = daysUntil(date);
  return days !== null && days >= 0 && days < 7;
}