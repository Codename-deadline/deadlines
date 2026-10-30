import { describe, expect, test } from "vitest";
import {
  mapPage,
  toAttachment,
  toChangeOrganizationOwnerRequest,
  toCreateDeadlineRequest,
  toCreateOrganizationRequest,
  toCreateOtpRequest,
  toCreateThreadRequest,
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

test("toOrganization normalizes dates immutably", () => {
  const input = organization();
  const original = structuredClone(input);

  const result = toOrganization(input);

  expect(result).toEqual({ ...input, createdAt: timestamp, description: null });
  expect(input).toEqual(original);
});

test("toDeadline normalizes dates and defaults", () => {
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

test("toAttachment normalizes dates immutably", () => {
  const input = attachment();
  const original = structuredClone(input);

  const result = toAttachment(input);

  expect(result).toEqual({ ...input, uploadedAt: timestamp });
  expect(input).toEqual(original);
});

describe("toInvitation", () => {
  test("normalizes dates and organization", () => {
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

  test("normalizes answeredAt", () => {
    const input = invitation({ answeredAt: instant });

    const result = toInvitation(input);

    expect(result.answeredAt).toBe(timestamp);
  });
});

test("toMember normalizes users immutably", () => {
  const input = { user: user(), assignedAt: instant, role: "ORG_MEMBER" as const };
  const original = structuredClone(input);

  const result = toMember(input);

  expect(result).toEqual({ ...input, user: { ...input.user, joinedAt: timestamp, timeZone: "Etc/UTC" } });
  expect(input).toEqual(original);
});

test("mapPage preserves pagination immutably", () => {
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

test("toThreadWithRole normalizes dates and roles", () => {
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
    const input = "2026-06-01T12:34:56.123456789Z";

    const result = toTimestamp(input);

    expect(result).toBe(timestamp);
  });

  test("preserves timestamps", () => {
    const result = toTimestamp(timestamp);

    expect(result).toBe(timestamp);
  });

  test("rejects invalid dates", () => {
    const input = "not-a-date";

    const act = () => toTimestamp(input);

    expect(act).toThrow();
  });

  test("rejects non-finite timestamps", () => {
    const act = () => toTimestamp(Number.NaN);

    expect(act).toThrow("Invalid timestamp");
  });
});

describe("toOtpVerification", () => {
  test("normalizes authenticated responses", () => {
    const tokenPair = { accessToken: "access", refreshToken: "refresh" };

    const result = toOtpVerification({ tokenPair });

    expect(result).toEqual({ passwordRequired: false, tokenPair });
  });

  test("normalizes password challenges", () => {
    const input = { passwordRequired: true, requestId: "request" };

    const result = toOtpVerification(input);

    expect(result).toEqual({
      passwordRequired: true,
      requestId: "request",
    });
  });

  test("rejects missing request IDs", () => {
    const tokenPair = { accessToken: "access", refreshToken: "refresh" };

    const act = () => toOtpVerification({ passwordRequired: true, tokenPair });

    expect(act).toThrow("no request ID");
  });

  test("rejects missing token pairs", () => {
    const input = { passwordRequired: false, requestId: "request" };

    const act = () => toOtpVerification(input);

    expect(act).toThrow("no token pair");
  });
});

describe("toPatchUserRequest", () => {
  test("normalizes profiles immutably", () => {
    const input = { username: " user ", fullName: " Full Name ", timeZone: "UTC" };
    const original = structuredClone(input);

    const result = toPatchUserRequest(input);

    expect(result).toEqual({ username: "user", fullName: "Full Name", timeZone: "Etc/UTC" });
    expect(input).toEqual(original);
  });

  test("preserves null", () => {
    const input = { fullName: null };

    const result = toPatchUserRequest(input);

    expect(result).toEqual(input);
  });

  test("preserves omitted fields", () => {
    const result = toPatchUserRequest({});

    expect(result).toEqual({});
  });
});

test("toChangeOrganizationOwnerRequest trims usernames", () => {
  const input = { newOwnerUsername: " owner " };

  const result = toChangeOrganizationOwnerRequest(input);

  expect(result).toEqual({ newOwnerUsername: "owner" });
});

test("toRegisterOtpRequest normalizes the time zone", () => {
  const input = {
    username: "user",
    fullName: "User",
    identifier: "7",
    channel: "TELEGRAM" as const,
    language: "EN" as const,
    timeZone: "UTC",
  };

  const result = toRegisterOtpRequest(input);

  expect(result.timeZone).toBe("Etc/UTC");
});

test("toCreateOtpRequest normalizes usernames immutably", () => {
  const input = { username: "@@user ", identifier: "123", channel: "TELEGRAM" as const };

  const result = toCreateOtpRequest(input);

  expect(result).toEqual({ ...input, username: "user" });
  expect(input.username).toBe("@@user ");
});

test("toCreateDeadlineRequest serializes the due date", () => {
  const result = toCreateDeadlineRequest({ title: "Deadline", due: timestamp, invitations: [] });

  expect(result.due).toBe(instant);
});

describe("toPatchDeadlineRequest", () => {
  test("serializes epoch dates", () => {
    const input = { due: 0 };

    const result = toPatchDeadlineRequest(input);

    expect(result).toEqual({ due: "1970-01-01T00:00:00Z" });
  });

  test("preserves null dates", () => {
    const input = { due: null };

    const result = toPatchDeadlineRequest(input);

    expect(result).toEqual(input);
  });

  test("preserves unrelated fields", () => {
    const input = { isCompleted: true };

    const result = toPatchDeadlineRequest(input);

    expect(result).toEqual(input);
  });
});

type InvitationInput = { username: string; role: string };
const createRequests = [
  {
    name: "organization",
    role: "ORG_MEMBER",
    create: (invitations: InvitationInput[]) =>
      toCreateOrganizationRequest({ title: "Organization", type: "PRIVATE", invitations }),
  },
  {
    name: "thread",
    role: "THR_ASSIGNEE",
    create: (invitations: InvitationInput[]) => toCreateThreadRequest({ title: "Thread", invitations }),
  },
  {
    name: "deadline",
    role: "DDL_ASSIGNEE",
    create: (invitations: InvitationInput[]) =>
      toCreateDeadlineRequest({ title: "Deadline", due: timestamp, invitations }),
  },
];

test.each(createRequests)("$name creation normalizes invitations without changing their input", ({ create, role }) => {
  const invitations = [
    { username: " @@user ", role },
    { username: "user", role: "INVALID" },
    { username: "@", role: "INVALID" },
    { username: "second", role },
  ];
  const original = structuredClone(invitations);

  const request = create(invitations);

  expect(request.invitations).toEqual([
    { username: "user", role },
    { username: "second", role },
  ]);
  expect(invitations).toEqual(original);
});

test.each(createRequests)("$name creation rejects invalid roles for unique invitees", ({ create }) => {
  const invitations = [{ username: "user", role: "INVALID" }];

  expect(() => create(invitations)).toThrow(TypeError);
});
