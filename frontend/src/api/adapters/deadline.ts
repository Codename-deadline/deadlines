import { msToIso } from "@/utils/date";
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
export type CreateDeadlineInput = Omit<CreateDeadlineRequest, "due"> & { due: string | number };
export type PatchDeadlineInput = Omit<PatchDeadlineRequest, "due"> & { due?: string | number | null };

export function toCreateDeadlineRequest(input: CreateDeadlineInput): CreateDeadlineRequest {
  return { ...input, due: typeof input.due === "number" ? msToIso(input.due) : input.due };
}

export function toPatchDeadlineRequest(input: PatchDeadlineInput): PatchDeadlineRequest {
  const { due, ...rest } = input;
  if (!("due" in input)) return rest;
  return { ...rest, due: typeof due === "number" ? msToIso(due) : due };
}
