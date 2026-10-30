<script setup lang="ts">
import { useQueryCache } from "@pinia/colada";
import { ref, watch } from "vue";
import { type LocationQueryValue, useRoute } from "vue-router";
import { getDeadline } from "@/api/deadline";
import { useApi } from "@/composables/useApi";
import { useDefaultQueryEnabled } from "@/composables/useDefaultQueryEnabled";
import { resolveOrganization as resolveOrganizationQuery } from "@/composables/useOrganizations";
import { useRequestError } from "@/composables/useRequestError";
import { resolveThread as resolveThreadQuery } from "@/composables/useThreads";
import { type ScopeHierarchy, useCurrentScopeStore } from "@/stores/CurrentScopeStore";
import { useTokenStore } from "@/stores/TokenStore";
import { parsePositiveRouteId } from "@/utils/route";

const route = useRoute();
const { makeRequest } = useApi();
const currentScopeStore = useCurrentScopeStore();
const cache = useQueryCache();
const tokens = useTokenStore();
const defaultEnabled = useDefaultQueryEnabled();
const displayError = useRequestError();

const ready = ref<boolean>(false);
let resolutionGeneration: number = 0;

const resolveOrganization = async (organizationId: number) => {
  if (!defaultEnabled()) return null;
  try {
    return await resolveOrganizationQuery(organizationId, cache);
  }
  catch (error) {
    displayError(error);
    return null;
  }
};

const resolveThread = async (threadId: number) => {
  if (!defaultEnabled()) return null;
  try {
    const thread = await resolveThreadQuery(threadId, cache);
    if (!thread) return null;

    const organization = await resolveOrganization(thread.organizationId);
    return organization ? { organization, thread } : null;
  } catch (error) {
    displayError(error);
    return null;
  }
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

  const session = tokens.sessionSignal();
  const scope = await resolver(entityId);
  if (scope && generation === resolutionGeneration && !session.aborted) {
    currentScopeStore.replaceScope(scopeMapper(scope));
  }
  return scope !== null;
}

watch(
  () => route.fullPath,
  async () => {
    const generation = ++resolutionGeneration;
    const session = tokens.sessionSignal();
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

    if (generation !== resolutionGeneration || session.aborted) return;
    if (!resolved) currentScopeStore.$reset();
    ready.value = true;
  },
  { immediate: true },
);
</script>

<template>
  <RouterView v-if="ready" :key="route.fullPath" />
</template>
