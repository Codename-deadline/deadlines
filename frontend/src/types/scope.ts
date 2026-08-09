import type { AnyRole } from "@/api/common/AnyRole";

export type ScopeType = "organization" | "thread" | "deadline";

export type UserScopedRoles<T extends AnyRole> = {
  scope: T | null;
  global?: AnyRole;
};
