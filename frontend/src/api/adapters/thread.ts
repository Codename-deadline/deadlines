import type { ThreadResponse, ThreadResponseWithRole } from "../generated/models";
import { toTimestamp } from "./common";

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
