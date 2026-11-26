import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { toCreateEventRequest, toEvent } from "@/api/adapters/event";
import { EVENT_PRESENTATIONS } from "@/domain/events";
import { computeEventState } from "@/utils/state";
import { deadline } from "./fixtures";

describe("important dates", () => {
  const now = Date.UTC(2026, 10, 24, 12);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });
  afterEach(() => vi.useRealTimers());

  test("alerts become occurred when their date arrives", () => {
    const alert = { kind: "ALERT", due: now + 1, isCompleted: false } as const;
    expect(computeEventState(alert)).toBe("upcoming");
    vi.setSystemTime(now + 1);
    expect(computeEventState(alert)).toBe("occurred");
  });

  test("past alerts never become overdue or completed", () => {
    expect(computeEventState({ kind: "ALERT", due: now - 1, isCompleted: true })).toBe("occurred");
    expect(computeEventState({ kind: "DEADLINE", due: now - 1, isCompleted: false })).toBe("overdue");
    expect(computeEventState({ kind: "DEADLINE", due: now - 1, isCompleted: true })).toBe("completed");
  });

  test("alert kind survives API serialization and normalization", () => {
    const request = toCreateEventRequest({ kind: "ALERT", title: "Release", due: now, invitations: [] });
    expect(request.kind).toBe("ALERT");
    expect(request.due).toBe("2026-11-24T12:00:00Z");
    expect(toEvent(deadline({ kind: "ALERT" })).kind).toBe("ALERT");
  });

  test("event policies control labels and completion consistently", () => {
    const alert = EVENT_PRESENTATIONS.ALERT;
    expect(alert.dateLabelKey).toBe(alert.dueLabelKey);
    expect(alert.supportsCompletion).toBe(false);
    expect(alert.completionPatch(true)).toBeUndefined();
    expect(EVENT_PRESENTATIONS.DEADLINE.supportsCompletion).toBe(true);
    expect(EVENT_PRESENTATIONS.DEADLINE.completionPatch(true)).toBe(true);
    expect(EVENT_PRESENTATIONS.DEADLINE.completionPatch(false)).toBe(false);
  });
});
