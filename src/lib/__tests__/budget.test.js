
import { describe, it, expect } from "vitest";
import {
  splitBudget,
  isTightBudget,
  budgetPerGuest,
  categoryHealth,
  phaseForDays,
  vendorStatusIndex,
} from "../budget.js";

describe("splitBudget", () => {
  it("keeps allocations equal to the rounded total for every event type", () => {
    const eventTypes = [
      "wedding",
      "birthday",
      "baby_shower",
      "corporate",
      "community",
      "anniversary",
      "other",
    ];

    for (const eventType of eventTypes) {
      const result = splitBudget(123457, eventType);
      const allocatedTotal = result.reduce(
        (sum, item) => sum + item.allocated,
        0
      );

      expect(allocatedTotal).toBe(123457);
    }
  });

  it("never produces negative allocations for a small budget", () => {
    const result = splitBudget(1, "wedding");

    expect(result.every((item) => item.allocated >= 0)).toBe(true);
    expect(
      result.reduce((sum, item) => sum + item.allocated, 0)
    ).toBe(1);
  });

  it("allocates the full budget across categories", () => {
    const result = splitBudget(100000, "wedding");

    expect(
      result.reduce((sum, item) => sum + item.allocated, 0)
    ).toBe(100000);
  });

  it("handles zero and negative budgets", () => {
    expect(
      splitBudget(0, "birthday").every((item) => item.allocated === 0)
    ).toBe(true);

    expect(
      splitBudget(-500, "birthday").every((item) => item.allocated === 0)
    ).toBe(true);
  });

  it("uses the default allocation for unknown event types", () => {
    expect(splitBudget(1000, "unknown")).toEqual(
      splitBudget(1000, "other")
    );
  });
});

describe("budgetPerGuest", () => {
  it("calculates rounded spending per guest", () => {
    expect(
      budgetPerGuest({ budget_total: 10000, guest_count: 30 })
    ).toBe(333);
  });

  it("returns zero when the event is missing", () => {
    expect(budgetPerGuest(null)).toBe(0);
  });
});

describe("isTightBudget", () => {
  it("flags a zero budget as tight", () => {
    expect(
      isTightBudget({ budget_total: 0, guest_count: 50 })
    ).toBe(true);
  });

  it("uses the INR per-guest threshold", () => {
    expect(
      isTightBudget({
        budget_total: 40000,
        guest_count: 50,
        currency: "INR",
      })
    ).toBe(true);

    expect(
      isTightBudget({
        budget_total: 50000,
        guest_count: 50,
        currency: "INR",
      })
    ).toBe(false);
  });
});

describe("categoryHealth", () => {
  it("marks spending below 80% as okay", () => {
    expect(categoryHealth(1000, 500)).toEqual({
      pct: 50,
      state: "ok",
    });
  });

  it("marks spending at 80% as watch", () => {
    expect(categoryHealth(1000, 800)).toEqual({
      pct: 80,
      state: "watch",
    });
  });

  it("marks overspending as over", () => {
    expect(categoryHealth(1000, 1200)).toEqual({
      pct: 120,
      state: "over",
    });
  });

  it("handles zero allocation", () => {
    expect(categoryHealth(0, 0)).toEqual({
      pct: 0,
      state: "empty",
    });

    expect(categoryHealth(0, 100)).toEqual({
      pct: 100,
      state: "over",
    });
  });
});

describe("phaseForDays", () => {
  it("maps event planning time to the right phase", () => {
    expect(phaseForDays(90).key).toBe("far");
    expect(phaseForDays(60).key).toBe("two_months");
    expect(phaseForDays(30).key).toBe("month");
    expect(phaseForDays(14).key).toBe("weeks");
    expect(phaseForDays(7).key).toBe("fortnight");
    expect(phaseForDays(1).key).toBe("week");
    expect(phaseForDays(0).key).toBe("day");
  });
});

describe("vendorStatusIndex", () => {
  it("returns the index of a known vendor status", () => {
    expect(vendorStatusIndex("booked")).toBe(2);
  });

  it("defaults unknown statuses to the first status", () => {
    expect(vendorStatusIndex("unknown")).toBe(0);
  });
});
