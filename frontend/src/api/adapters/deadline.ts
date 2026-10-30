import { msToIso } from "@/utils/date";
import { normalizeUsername } from "@/utils/validation";
import type { CreateDeadlineRequest, DeadlineResponseWithRole, PatchDeadlineRequest } from "../generated/models";
import { toTimestamp } from "./common";

export function toDeadline(dto: DeadlineResponseWithRole) {
  const { createdAt, due, description, role, globalRole, ...rest } = dto;
  return {
    ...rest,
    createdAt: toTimestamp(createdAt),
    due: toTimestamp(due),
    description: description ?? null,
    role: role ?? null,
    globalRole: globalRole ?? null,
  };
}

export type DeadlineModel = ReturnType<typeof toDeadline>;
export type CreateDeadlineInput = Omit<CreateDeadlineRequest, "due" | "invitations"> & {
  due: string | number;
  invitations: { username: string; role: string }[];
};
export type PatchDeadlineInput = Omit<PatchDeadlineRequest, "due"> & { due?: string | number | null };

export function toCreateDeadlineRequest(input: CreateDeadlineInput): CreateDeadlineRequest {
  const invitations = new Map<string, CreateDeadlineRequest["invitations"][number]>();
  for (const invitation of input.invitations) {
    const username = normalizeUsername(invitation.username.trim());
    if (username && !invitations.has(username)) {
      invitations.set(username, { username, role: toDeadlineRole(invitation.role) });
    }
  }

  return {
    ...input,
    invitations: [...invitations.values()],
    due: typeof input.due === "number" ? msToIso(input.due) : input.due,
  };
}

export function toPatchDeadlineRequest(input: PatchDeadlineInput): PatchDeadlineRequest {
  const { due, ...rest } = input;
  if (!("due" in input)) return rest;
  return { ...rest, due: typeof due === "number" ? msToIso(due) : due };
}

export function toDeadlineRole(role: string): "DDL_ASSIGNEE" {
  if (role === "DDL_ASSIGNEE") return role;
  throw new TypeError("Invalid deadline role");
}
