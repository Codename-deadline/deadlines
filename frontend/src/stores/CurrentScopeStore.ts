import { useQueryCache } from "@pinia/colada";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { type OrganizationModel, toOrganization } from "@/api/adapters/organization";
import { getGetOrganizationMetadataQueryKey } from "@/api/generated/endpoints/organizations/organizations";
import type { OrganizationResponse } from "@/api/generated/models";
import type { DeadlineWithRole } from "@/api/schemas/deadline/common/Deadline";
import type { Thread } from "@/api/schemas/thread/common/Thread";
import type { ScopeType } from "@/types/scope";

type ScopeEntity =
  | { entity: OrganizationModel; type: "organization" }
  | { entity: Thread; type: "thread" }
  | { entity: DeadlineWithRole; type: "deadline" };

export type ScopeHierarchy = {
  organization: OrganizationModel | null;
  thread: Thread | null;
  deadline: DeadlineWithRole | null;
};

export const useCurrentScopeStore = defineStore("currentScope", () => {
  const cache = useQueryCache();
  const organizationId = ref<number | null>(null);
  const organization = computed(() => {
    if (!organizationId.value) return null;
    const dto = cache.getQueryData<OrganizationResponse>(getGetOrganizationMetadataQueryKey(organizationId.value));
    return dto ? toOrganization(dto) : null;
  });
  const thread = ref<Thread | null>(null);
  const deadline = ref<DeadlineWithRole | null>(null);

  function withScope(config: ScopeEntity) {
    switch (config.type) {
      case "organization":
        organizationId.value = config.entity.id;
        thread.value = null;
        deadline.value = null;
        break;
      case "thread":
        if (organizationId.value !== config.entity.organizationId) {
          organizationId.value = null;
        }
        thread.value = config.entity;
        deadline.value = null;
        break;
      case "deadline":
        if (thread.value?.id !== config.entity.threadId) {
          organizationId.value = null;
          thread.value = null;
        }
        deadline.value = config.entity;
        break;
    }
  }

  function exitScope(scopeType: ScopeType) {
    switch (scopeType) {
      case "organization":
        organizationId.value = null;
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

    organizationId.value = scope.organization?.id ?? null;
    thread.value = scope.thread;
    deadline.value = scope.deadline;
  }

  function $reset() {
    exitScope("organization");
  }

  return {
    organization,
    organizationId,
    thread,
    deadline,
    withScope,
    exitScope,
    exitAndSet,
    replaceScope,
    $reset,
  };
});
