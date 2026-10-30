<script setup lang="ts">
import { computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { ThreadWithRoleModel } from "@/api/adapters/thread";
import PageLayout from "@/components/home/common/PageLayout.vue";
import CreateThreadDialog from "@/components/home/threads/CreateThreadDialog.vue";
import EditThreadDialog from "@/components/home/threads/EditThreadDialog.vue";
import ThreadCard from "@/components/home/threads/ThreadCard.vue";
import { useOrganizationThreads } from "@/composables/useThreads";
import { useCurrentScopeStore } from "@/stores/CurrentScopeStore";
import { parsePositiveRouteId } from "@/utils/route";

const router = useRouter();
const route = useRoute();
const scope = useCurrentScopeStore();

const orgId = computed(() => parsePositiveRouteId(route.query.orgId) ?? -1);
const { items, isLoading, error, hasNextPage, loadMore, retry } = useOrganizationThreads(orgId);

watch(orgId, (id) => {
  if (route.name === "Threads" && id <= 0) {
    void router.replace("/organizations");
  }
}, { immediate: true });

const showCreateThreadButton = computed(() => Boolean(
  orgId.value
  && scope.organization?.id === orgId.value
  && scope.organization.permissions.createThreads
));

const onCardClick = (thread: ThreadWithRoleModel) => {
  router.push({ path: "/deadlines", query: { thrId: thread.id } });
};
</script>

<template>
  <PageLayout
    v-if="orgId > 0"
    @card-clicked="onCardClick"
    :items="items" :loading="isLoading" :error="error"
    :has-more="hasNextPage" :load-more="loadMore" :retry="retry"
    :entity-card-component="ThreadCard"
    :edit-dialog-component="EditThreadDialog"
    :create-dialog-component="CreateThreadDialog"
    :show-create-button="showCreateThreadButton"
    scope-type="thread"
  />
</template>
