import type { CreateThreadRequest, ThreadResponse, ThreadResponseWithRole } from "../generated/models";
import { normalizeInvitations, toTimestamp } from "./common";

export type ThreadModel<T extends ThreadResponse = ThreadResponse> = Omit<T, "createdAt" | "description"> & {
  createdAt: number;
  description: string | null;
};

export function toThread<T extends ThreadResponse>(dto: T): ThreadModel<T> {
  const { createdAt, description, ...rest } = dto;
  return { ...rest, createdAt: toTimestamp(createdAt), description: description ?? null };
}

export function toThreadWithRole(dto: ThreadResponseWithRole) {
  const { role, globalRole, ...rest } = toThread(dto);
  return { ...rest, role: role ?? null, globalRole: globalRole ?? null };
}

export type ThreadWithRoleModel = ReturnType<typeof toThreadWithRole>;

export function toThreadRole(role: string) {
  if (role === "THR_ASSIGNEE" || role === "THR_ADMIN" || role === "THR_OWNER") return role;
  throw new TypeError("Invalid thread role");
}

export function toCreateThreadRequest(
  request: Omit<CreateThreadRequest, "invitations"> & {
    invitations: { username: string; role: string }[];
  },
): CreateThreadRequest {
  return { ...request, invitations: normalizeInvitations(request.invitations, toThreadRole) };
}
