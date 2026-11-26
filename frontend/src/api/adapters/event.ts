import { msToIso } from "@/utils/date";
import type { CreateEventRequest, EventResponseWithRole, PatchEventRequest } from "../generated/models";
import { normalizeInvitations, toTimestamp } from "./common";

export function toEvent(dto: EventResponseWithRole) {
  const { createdAt, due, description, role, globalRole, kind = "DEADLINE", ...rest } = dto;
  return {
    ...rest,
    kind,
    createdAt: toTimestamp(createdAt),
    due: toTimestamp(due),
    description: description ?? null,
    role: role ?? null,
    globalRole: globalRole ?? null,
  };
}

export type EventModel = ReturnType<typeof toEvent>;
export type CreateEventInput = Omit<CreateEventRequest, "due" | "invitations"> & {
  due: string | number;
  invitations: { username: string; role: string }[];
};
export type PatchEventInput = Omit<PatchEventRequest, "due"> & { due?: string | number | null };

export function toCreateEventRequest(input: CreateEventInput): CreateEventRequest {
  return {
    ...input,
    invitations: normalizeInvitations(input.invitations, toEventRole),
    due: typeof input.due === "number" ? msToIso(input.due) : input.due,
  };
}

export function toPatchEventRequest(input: PatchEventInput): PatchEventRequest {
  const { due, ...rest } = input;
  if (!("due" in input)) return rest;
  return { ...rest, due: typeof due === "number" ? msToIso(due) : due };
}

export function toEventRole(role: string): "DDL_ASSIGNEE" {
  if (role === "DDL_ASSIGNEE") return role;
  throw new TypeError("Invalid deadline role");
}
