
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  planningScore,
  scoreStage,
  isEmergency,
} from "../plan-metrics.js";

afterEach(() => {
  vi.useRealTimers();
});

describe("planningScore", () => {
  it("returns zero when there is no planning progress", () => {
    expect(planningScore()).toBe(0);
  });

  it("calculates the weighted score for partial progress", () => {
    expect(
      planningScore({
        tasksDone: 5,
        tasksTotal: 10,
        vendorPoints: 5,
        vendorMax: 10,
        categoriesLogged: 5,
        categoriesTotal: 10,
      })
    ).toBe(50);
  });

  it("returns 100 when every planning area is complete", () => {
    expect(
      planningScore({
        tasksDone: 10,
        tasksTotal: 10,
        vendorPoints: 10,
        vendorMax: 10,
        categoriesLogged: 10,
        categoriesTotal: 10,
      })
    ).toBe(100);
  });

  it("caps the score at 100", () => {
    expect(
      planningScore({
        tasksDone: 20,
        tasksTotal: 10,
        vendorPoints: 20,
        vendorMax: 10,
        categoriesLogged: 20,
        categoriesTotal: 10,
      })
    ).toBe(100);
  });

  it("handles zero totals without dividing by zero", () => {
    expect(
      planningScore({
        tasksDone: 5,
        tasksTotal: 0,
        vendorPoints: 5,
        vendorMax: 0,
        categoriesLogged: 5,
        categoriesTotal: 0,
      })
    ).toBe(0);
  });
});

describe("scoreStage", () => {
  it.each([
    [0, "Just getting started"],
    [25, "Finding its shape"],
    [50, "Coming together"],
    [75, "Almost event-ready"],
    [95, "Ready to celebrate"],
  ])("maps score %i to the expected stage", (score, label) => {
    expect(scoreStage(score).label).toBe(label);
  });

  it("keeps the first stage for scores below zero", () => {
    expect(scoreStage(-1).label).toBe("Just getting started");
  });
});

describe("isEmergency", () => {
  it("flags an event happening today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-26T12:00:00"));

    expect(isEmergency("2026-10-26")).toBe(true);
  });

  it("flags an event six days away", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-26T12:00:00"));

    expect(isEmergency("2026-11-01")).toBe(true);
  });

  it("does not flag an event exactly seven days away", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-26T12:00:00"));

    expect(isEmergency("2026-11-02")).toBe(false);
  });

  it("does not flag an event in the past", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-26T12:00:00"));

    expect(isEmergency("2026-10-25")).toBe(false);
  });

  it("does not flag an invalid or missing date", () => {
    expect(isEmergency(null)).toBe(false);
    expect(isEmergency("not-a-date")).toBe(false);
  });
});
