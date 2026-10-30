<script setup lang="ts">
import { computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { ThreadWithRoleModel } from "@/api/adapters/thread";
import PageLayout from "@/components/home/common/PageLayout.vue";
import CreateThreadDialog from "@/components/home/threads/CreateThreadDialog.vue";
import EditThreadDialog from "@/components/home/threads/EditThreadDialog.vue";
import ThreadCard from "@/components/home/threads/ThreadCard.vue";
import { useOrganizationThreads, useUserAssignedThreads } from "@/composables/useThreads";
import { useCurrentScopeStore } from "@/stores/CurrentScopeStore";
import { parsePositiveRouteId } from "@/utils/route";

const router = useRouter();
const route = useRoute();
const scope = useCurrentScopeStore();

const orgId = computed(() => parsePositiveRouteId(route.query.orgId) ?? -1);
const showAssignedThreads = computed(() => route.query.orgId === undefined);
const assignedThreads = useUserAssignedThreads(showAssignedThreads);
const organizationThreads = useOrganizationThreads(orgId);
const threads = computed(() => showAssignedThreads.value ? assignedThreads : organizationThreads);

watch([orgId, showAssignedThreads], ([id, assigned]) => {
  if (route.name === "Threads" && !assigned && id <= 0) {
    void router.replace("/organizations");
  }
}, { immediate: true });

const showCreateThreadButton = computed(() => Boolean(
  orgId.value > 0
  && scope.organization?.id === orgId.value
  && scope.organization.permissions.createThreads
));

const onCardClick = (thread: ThreadWithRoleModel) => {
  router.push({ path: "/deadlines", query: { thrId: thread.id } });
};
</script>

<template>
  <PageLayout
    v-if="showAssignedThreads || orgId > 0"
    @card-clicked="onCardClick"
    :items="threads.items.value" :loading="threads.isLoading.value" :error="threads.error.value"
    :has-more="threads.hasNextPage.value" :load-more="threads.loadMore" :retry="threads.retry"
    :entity-card-component="ThreadCard"
    :edit-dialog-component="EditThreadDialog"
    :create-dialog-component="CreateThreadDialog"
    :show-create-button="showCreateThreadButton"
    scope-type="thread"
  />
</template>
