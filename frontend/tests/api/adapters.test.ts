import { describe, expect, test } from "vitest";
import {
  mapPage,
  toAttachment,
  toChangeOrganizationOwnerRequest,
  toCreateDeadlineRequest,
  toDeadline,
  toInvitation,
  toMember,
  toOrganization,
  toOtpVerification,
  toPatchDeadlineRequest,
  toPatchUserRequest,
  toRegisterOtpRequest,
  toThreadWithRole,
  toTimestamp,
} from "@/api/adapters";
import { attachment, deadline, instant, invitation, organization, thread, timestamp, user } from "./fixtures";

test("toOrganization normalizes the creation date without mutating the DTO", () => {
  const input = organization();
  const original = structuredClone(input);

  const result = toOrganization(input);

  expect(result).toEqual({ ...input, createdAt: timestamp, description: null });
  expect(input).toEqual(original);
});

test("toDeadline normalizes dates and nullable fields without mutating the DTO", () => {
  const input = deadline();
  const original = structuredClone(input);

  const result = toDeadline(input);

  expect(result).toEqual({
    ...input,
    createdAt: timestamp,
    due: timestamp + 86_400_000,
    isCompleted: false,
    description: null,
    role: null,
    globalRole: null,
  });
  expect(input).toEqual(original);
});

test("toAttachment normalizes the upload date without mutating the DTO", () => {
  const input = attachment();
  const original = structuredClone(input);

  const result = toAttachment(input);

  expect(result).toEqual({ ...input, uploadedAt: timestamp });
  expect(input).toEqual(original);
});

describe("toInvitation", () => {
  test("normalizes dates and the nested organization without mutating the DTO", () => {
    const input = invitation();
    const original = structuredClone(input);

    const result = toInvitation(input);

    expect(result).toEqual({
      ...input,
      createdAt: timestamp,
      answeredAt: null,
      organization: { ...input.organization, createdAt: timestamp, description: null },
    });
    expect(input).toEqual(original);
  });

  test("normalizes the answer date for an answered invitation", () => {
    expect(toInvitation(invitation({ answeredAt: instant })).answeredAt).toBe(timestamp);
  });
});

test("toMember normalizes the nested user without mutating the DTO", () => {
  const input = { user: user(), assignedAt: instant, role: "ORG_MEMBER" as const };
  const original = structuredClone(input);

  const result = toMember(input);

  expect(result).toEqual({ ...input, user: { ...input.user, joinedAt: timestamp, timeZone: "Etc/UTC" } });
  expect(input).toEqual(original);
});

test("mapPage maps members and preserves pagination without mutating the page", () => {
  const member = { user: user(), assignedAt: instant, role: "ORG_MEMBER" as const };
  const input = { data: [member], totalPages: 8 };
  const original = structuredClone(input);

  const result = mapPage(input, toMember);

  expect(result).toEqual({
    totalPages: 8,
    data: [{ ...member, user: { ...member.user, joinedAt: timestamp, timeZone: "Etc/UTC" } }],
  });
  expect(input).toEqual(original);
});

test("toThreadWithRole normalizes dates and roles without mutating the DTO", () => {
  const input = thread();
  const original = structuredClone(input);

  const result = toThreadWithRole(input);

  expect(result).toEqual({
    ...input,
    createdAt: timestamp,
    description: null,
    role: null,
    globalRole: "ORG_MEMBER",
  });
  expect(input).toEqual(original);
});

describe("toTimestamp", () => {
  test("preserves millisecond precision", () => {
    expect(toTimestamp("2026-06-01T12:34:56.123456789Z")).toBe(timestamp);
  });

  test("preserves an existing timestamp", () => {
    expect(toTimestamp(timestamp)).toBe(timestamp);
  });

  test("rejects an invalid date string", () => {
    expect(() => toTimestamp("not-a-date")).toThrow();
  });

  test("rejects a non-finite timestamp", () => {
    expect(() => toTimestamp(Number.NaN)).toThrow("Invalid timestamp");
  });
});

describe("toOtpVerification", () => {
  test("normalizes an authenticated response", () => {
    const tokenPair = { accessToken: "access", refreshToken: "refresh" };

    expect(toOtpVerification({ tokenPair })).toEqual({ passwordRequired: false, tokenPair });
  });

  test("normalizes a password-required response", () => {
    expect(toOtpVerification({ passwordRequired: true, requestId: "request" })).toEqual({
      passwordRequired: true,
      requestId: "request",
    });
  });

  test("rejects a password-required response without a request ID", () => {
    const tokenPair = { accessToken: "access", refreshToken: "refresh" };

    expect(() => toOtpVerification({ passwordRequired: true, tokenPair })).toThrow("no request ID");
  });

  test("rejects an authenticated response without a token pair", () => {
    expect(() => toOtpVerification({ passwordRequired: false, requestId: "request" })).toThrow("no token pair");
  });
});

describe("toPatchUserRequest", () => {
  test("trims profile fields and normalizes the time zone without mutating the input", () => {
    const input = { username: " user ", fullName: " Full Name ", timeZone: "UTC" };
    const original = structuredClone(input);

    const result = toPatchUserRequest(input);

    expect(result).toEqual({ username: "user", fullName: "Full Name", timeZone: "Etc/UTC" });
    expect(input).toEqual(original);
  });

  test("preserves an explicit null", () => {
    expect(toPatchUserRequest({ fullName: null })).toEqual({ fullName: null });
  });

  test("preserves omitted fields", () => {
    expect(toPatchUserRequest({})).toEqual({});
  });
});

test("toChangeOrganizationOwnerRequest trims the new owner's username", () => {
  expect(toChangeOrganizationOwnerRequest({ newOwnerUsername: " owner " })).toEqual({ newOwnerUsername: "owner" });
});

test("toRegisterOtpRequest normalizes the time zone", () => {
  const result = toRegisterOtpRequest({
    username: "user",
    fullName: "User",
    identifier: "7",
    channel: "TELEGRAM",
    language: "EN",
    timeZone: "UTC",
  });

  expect(result.timeZone).toBe("Etc/UTC");
});

test("toCreateDeadlineRequest serializes the due date", () => {
  const result = toCreateDeadlineRequest({ title: "Deadline", due: timestamp, invitations: [] });

  expect(result.due).toBe(instant);
});

describe("toPatchDeadlineRequest", () => {
  test("serializes an epoch due date", () => {
    expect(toPatchDeadlineRequest({ due: 0 })).toEqual({ due: "1970-01-01T00:00:00Z" });
  });

  test("preserves an explicit null due date", () => {
    expect(toPatchDeadlineRequest({ due: null })).toEqual({ due: null });
  });

  test("preserves an omitted due date and unrelated fields", () => {
    expect(toPatchDeadlineRequest({ isCompleted: true })).toEqual({ isCompleted: true });
  });
});
