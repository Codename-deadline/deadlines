import { type InjectionKey, inject } from "vue";
import type { Router } from "vue-router";
import { UserScopeResponseRole } from "@/api/generated/models";
import type { AuthMethod } from "@/types/auth";
import type { ScopeType } from "@/types/scope";

export const redirectToOTP = (router: Router, otpId: string, authMethod: AuthMethod) => {
  router.push({
    path: "/auth/otp",
    query: {
      id: otpId,
      method: authMethod,
    },
  });
};

const rolePrefixes: Record<ScopeType, string> = {
  organization: "ORG_",
  thread: "THR_",
  deadline: "DDL_",
};

export const isRoleInScope = (role: string, scopeType: ScopeType): role is UserScopeResponseRole =>
  Object.values(UserScopeResponseRole).some((value) => value === role) && role.startsWith(rolePrefixes[scopeType]);

export const injectOrThrow = <T>(key: InjectionKey<T>): T => {
  const value = inject(key);
  if (!value) {
    throw new Error(`injectOrThrow: Unable to inject value for key ${String(key)}`);
  }
  return value;
};
