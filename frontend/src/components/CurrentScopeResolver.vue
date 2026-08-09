<script setup lang="ts">
import { ref, watch } from "vue";
import { type LocationQueryValue, useRoute } from "vue-router";
import { getDeadline } from "@/api/deadline";
import { getOrganization } from "@/api/organization";
import { getThread } from "@/api/thread";
import { useApi } from "@/composables/useApi";
import { type ScopeHierarchy, useCurrentScopeStore } from "@/stores/CurrentScopeStore";
import { parsePositiveRouteId } from "@/utils/route";

const route = useRoute();
const { makeRequest } = useApi();
const currentScopeStore = useCurrentScopeStore();
const ready = ref(false);
let resolutionGeneration: number = 0;

const resolveOrganization = async (organizationId: number) => {
  if (currentScopeStore.organization?.id === organizationId) {
    return currentScopeStore.organization;
  }

  const response = await makeRequest(() => getOrganization(organizationId));
  return response.ok ? response.data : null;
};

const resolveThread = async (threadId: number) => {
  const thread = currentScopeStore.thread?.id === threadId
    ? currentScopeStore.thread
    : await makeRequest(() => getThread(threadId)).then((response) => response.ok ? response.data : null);
  if (!thread) return null;

  const organization = await resolveOrganization(thread.organizationId);
  return organization ? { organization, thread } : null;
};

const resolveDeadline = async (deadlineId: number) => {
  const deadline = currentScopeStore.deadline?.id === deadlineId
    ? currentScopeStore.deadline
    : await makeRequest(() => getDeadline(deadlineId)).then((response) => response.ok ? response.data : null);
  if (!deadline) return null;

  const parentScope = await resolveThread(deadline.threadId);
  return parentScope ? { ...parentScope, deadline } : null;
};

const resolveScopeByRoute = async <T>(
  queryId: LocationQueryValue | LocationQueryValue[], resolver: (id: number) => Promise<T>, generation: number, scopeMapper: (scope: T) => ScopeHierarchy
): Promise<boolean> => {
  const entityId = parsePositiveRouteId(queryId);
  if (!entityId) return false;
  
  const scope = await resolver(entityId);
  if (scope && generation === resolutionGeneration) {
    currentScopeStore.replaceScope(scopeMapper(scope));
  }
  return scope !== null;
}

watch(
  () => route.fullPath,
  async () => {
    const generation = ++resolutionGeneration;
    ready.value = false;
    let resolved: boolean = false;

    switch (route.name) {
      case "Threads":
        resolved = await resolveScopeByRoute(route.query.orgId, resolveOrganization, generation, (organization) => {
          return { organization, thread: null, deadline: null }
        })
        break;
      case "Deadlines": {
        resolved = await resolveScopeByRoute(route.query.thrId, resolveThread, generation, (scope) => {
          return { ...scope, deadline: null } as ScopeHierarchy
        })
        break;
      }
      case "Deadline": {
        resolved = await resolveScopeByRoute(route.query.ddlId, resolveDeadline, generation, (scope) => {
          return scope as ScopeHierarchy
        })
        break;
      }
    }

    if (generation !== resolutionGeneration) return;
    if (!resolved) currentScopeStore.$reset();
    ready.value = true;
  },
  { immediate: true },
);
</script>

<template>
  <RouterView v-if="ready" :key="route.fullPath" />
</template>
