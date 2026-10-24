import { Language } from "@/types/Language";
import { normalizeTimeZone } from "@/utils/timeZone";
import type {
  ChangeOrganizationOwnerRequest,
  PatchUserRequest,
  RegisterOtpRequest,
  UserResponse,
  UserScopeResponse,
} from "../generated/models";
import { toTimestamp } from "./common";

export function toUser(dto: UserResponse) {
  return {
    ...dto,
    joinedAt: toTimestamp(dto.joinedAt),
    timeZone: normalizeTimeZone(dto.timeZone),
    language: dto.language === "RU" ? Language.RUSSIAN : Language.ENGLISH,
  };
}

export type UserModel = ReturnType<typeof toUser>;

export function toMember(dto: UserScopeResponse) {
  // assignedAt intentionally remains an ISO string, matching the existing Member schema.
  return { ...dto, user: toUser(dto.user) };
}

export type MemberModel = ReturnType<typeof toMember>;

export function toRegisterOtpRequest(dto: RegisterOtpRequest): RegisterOtpRequest {
  return { ...dto, timeZone: normalizeTimeZone(dto.timeZone) };
}

export function toPatchUserRequest(dto: PatchUserRequest): PatchUserRequest {
  const request = { ...dto };
  if (typeof request.username === "string") request.username = request.username.trim();
  if (typeof request.fullName === "string") request.fullName = request.fullName.trim();
  if (typeof request.timeZone === "string") request.timeZone = normalizeTimeZone(request.timeZone);
  return request;
}

export function toChangeOrganizationOwnerRequest(dto: ChangeOrganizationOwnerRequest): ChangeOrganizationOwnerRequest {
  return { ...dto, newOwnerUsername: dto.newOwnerUsername.trim() };
}
