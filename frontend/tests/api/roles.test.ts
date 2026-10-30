import { expect, test } from "vitest";
import { UserScopeResponseRole } from "@/api/generated/models";
import { isRoleInScope } from "@/utils";

test.each([
  { scope: "organization" as const, roles: ["ORG_ADMIN", "ORG_MEMBER", "ORG_OWNER"] },
  { scope: "thread" as const, roles: ["THR_ADMIN", "THR_ASSIGNEE", "THR_OWNER"] },
  { scope: "deadline" as const, roles: ["DDL_ASSIGNEE"] },
])("filters generated roles for $scope controls", ({ scope, roles }) => {
  const availableRoles = Object.values(UserScopeResponseRole);

  const options = availableRoles.filter((role) => isRoleInScope(role, scope));

  expect(options.sort()).toEqual(roles);
});

test.each(["", "ORG_", "ORG_UNKNOWN", "ORG_member", "THR_ADMIN_EXTRA", "DDL_OWNER", "MEMBER"])(
  "excludes unsupported metadata role %j",
  (role) => {
    const scopes = ["organization", "thread", "deadline"] as const;

    const matches = scopes.filter((scope) => isRoleInScope(role, scope));

    expect(matches).toEqual([]);
  },
);
