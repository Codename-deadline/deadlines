import { defineStore } from "pinia";
import { ref } from "vue";
import { type DeadlineModel, toDeadline } from "@/api/adapters/deadline";
import { type OrganizationModel, toOrganization } from "@/api/adapters/organization";
import { type ThreadModel, toThread } from "@/api/adapters/thread";
import { getGetDeadlineQueryKey } from "@/api/generated/endpoints/deadlines/deadlines";
import { getGetOrganizationMetadataQueryKey } from "@/api/generated/endpoints/organizations/organizations";
import { getGetThreadQueryKey } from "@/api/generated/endpoints/threads/threads";
import type { OrganizationResponse, ThreadResponse } from "@/api/generated/models";
import { useCachedEntity } from "@/composables/shared/useCachedEntity";
import type { ScopeType } from "@/types/scope";

type ScopeEntity =
  | { entity: OrganizationModel; type: "organization" }
  | { entity: ThreadModel; type: "thread" }
  | { entity: DeadlineModel; type: "deadline" };

export type ScopeHierarchy = {
  organization: OrganizationModel | null;
  thread: ThreadModel | null;
  deadline: DeadlineModel | null;
};

export const useCurrentScopeStore = defineStore("currentScope", () => {
  const organizationId = ref<number | null>(null);
  const organization = useCachedEntity(
    organizationId,
    getGetOrganizationMetadataQueryKey,
    toOrganization<OrganizationResponse>,
  );

  const threadId = ref<number | null>(null);
  const thread = useCachedEntity(threadId, getGetThreadQueryKey, toThread<ThreadResponse>);

  const deadlineId = ref<number | null>(null);
  const deadline = useCachedEntity(deadlineId, getGetDeadlineQueryKey, toDeadline);

  function withScope(config: ScopeEntity) {
    switch (config.type) {
      case "organization":
        organizationId.value = config.entity.id;
        threadId.value = null;
        deadlineId.value = null;
        break;
      case "thread":
        if (organizationId.value !== config.entity.organizationId) {
          organizationId.value = null;
        }
        threadId.value = config.entity.id;
        deadlineId.value = null;
        break;
      case "deadline":
        if (threadId.value !== config.entity.threadId) {
          organizationId.value = null;
          threadId.value = null;
        }
        deadlineId.value = config.entity.id;
        break;
    }
  }

  function exitScope(scopeType: ScopeType) {
    switch (scopeType) {
      case "organization":
        organizationId.value = null;
        threadId.value = null;
        deadlineId.value = null;
        break;
      case "thread":
        threadId.value = null;
        deadlineId.value = null;
        break;
      case "deadline":
        deadlineId.value = null;
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
    deadlineId.value = scope.deadline?.id ?? null;
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
    deadlineId,
    withScope,
    exitScope,
    exitAndSet,
    replaceScope,
    $reset,
  };
});
