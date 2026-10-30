import { useQueryCache } from "@pinia/colada";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { type OrganizationModel, toOrganization } from "@/api/adapters/organization";
import { type ThreadModel, toThread } from "@/api/adapters/thread";
import { getGetOrganizationMetadataQueryKey } from "@/api/generated/endpoints/organizations/organizations";
import { getGetThreadQueryKey } from "@/api/generated/endpoints/threads/threads";
import type { OrganizationResponse, ThreadResponse } from "@/api/generated/models";
import type { DeadlineWithRole } from "@/api/schemas/deadline/common/Deadline";
import type { ScopeType } from "@/types/scope";

type ScopeEntity =
  | { entity: OrganizationModel; type: "organization" }
  | { entity: ThreadModel; type: "thread" }
  | { entity: DeadlineWithRole; type: "deadline" };

export type ScopeHierarchy = {
  organization: OrganizationModel | null;
  thread: ThreadModel | null;
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
  const threadId = ref<number | null>(null);
  const thread = computed(() => {
    if (!threadId.value) return null;
    const dto = cache.getQueryData<ThreadResponse>(getGetThreadQueryKey(threadId.value));
    return dto ? toThread(dto) : null;
  });
  const deadline = ref<DeadlineWithRole | null>(null);

  function withScope(config: ScopeEntity) {
    switch (config.type) {
      case "organization":
        organizationId.value = config.entity.id;
        threadId.value = null;
        deadline.value = null;
        break;
      case "thread":
        if (organizationId.value !== config.entity.organizationId) {
          organizationId.value = null;
        }
        threadId.value = config.entity.id;
        deadline.value = null;
        break;
      case "deadline":
        if (threadId.value !== config.entity.threadId) {
          organizationId.value = null;
          threadId.value = null;
        }
        deadline.value = config.entity;
        break;
    }
  }

  function exitScope(scopeType: ScopeType) {
    switch (scopeType) {
      case "organization":
        organizationId.value = null;
        threadId.value = null;
        deadline.value = null;
        break;
      case "thread":
        threadId.value = null;
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
    threadId.value = scope.thread?.id ?? null;
    deadline.value = scope.deadline;
  }

  function $reset() {
    exitScope("organization");
  }

  return {
    organization,
    organizationId,
    thread,
    threadId,
    deadline,
    withScope,
    exitScope,
    exitAndSet,
    replaceScope,
    $reset,
  };
});
