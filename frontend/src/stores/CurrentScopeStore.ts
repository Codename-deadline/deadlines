import { defineStore } from "pinia";
import { ref } from "vue";
import type { DeadlineWithRole } from "@/api/schemas/deadline/common/Deadline";
import type { OrganizationWithStats } from "@/api/schemas/organization/common/Organization";
import type { Thread } from "@/api/schemas/thread/common/Thread";
import type { ScopeType } from "@/types/scope";

type ScopeEntity =
  | { entity: OrganizationWithStats; type: "organization" }
  | { entity: Thread; type: "thread" }
  | { entity: DeadlineWithRole; type: "deadline" };

export type ScopeHierarchy = {
  organization: OrganizationWithStats | null;
  thread: Thread | null;
  deadline: DeadlineWithRole | null;
};

export const useCurrentScopeStore = defineStore("currentScope", () => {
  const organization = ref<OrganizationWithStats | null>(null);
  const thread = ref<Thread | null>(null);
  const deadline = ref<DeadlineWithRole | null>(null);

  function withScope(config: ScopeEntity) {
    switch (config.type) {
      case "organization":
        organization.value = config.entity;
        thread.value = null;
        deadline.value = null;
        break;
      case "thread":
        if (organization.value?.id !== config.entity.organizationId) {
          organization.value = null;
        }
        thread.value = config.entity;
        deadline.value = null;
        break;
      case "deadline":
        if (thread.value?.id !== config.entity.threadId) {
          organization.value = null;
          thread.value = null;
        }
        deadline.value = config.entity;
        break;
    }
  }

  function exitScope(scopeType: ScopeType) {
    switch (scopeType) {
      case "organization":
        organization.value = null;
        thread.value = null;
        deadline.value = null;
        break;
      case "thread":
        thread.value = null;
        deadline.value = null;
        break;
      case "deadline":
        deadline.value = null;
        break;
    }
  }

  function exitAndSet(config: ScopeEntity) {
    exitScope(config.type);
    withScope(config);
  }

  function replaceScope(scope: ScopeHierarchy) {
    if (scope.thread && scope.organization?.id !== scope.thread.organizationId) {
      throw new Error("Thread does not belong to the current organization");
    }
    if (scope.deadline && scope.thread?.id !== scope.deadline.threadId) {
      throw new Error("Deadline does not belong to the current thread");
    }

    organization.value = scope.organization;
    thread.value = scope.thread;
    deadline.value = scope.deadline;
  }

  function $reset() {
    exitScope("organization");
  }

  return {
    organization,
    thread,
    deadline,
    withScope,
    exitScope,
    exitAndSet,
    replaceScope,
    $reset,
  };
});
