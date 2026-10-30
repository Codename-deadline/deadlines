<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { DeadlineModel } from "@/api/adapters/deadline";
import PageLayout from "@/components/home/common/PageLayout.vue";
import CreateDeadlineDialog from "@/components/home/deadlines/CreateDeadlineDialog.vue";
import DeadlineCard from "@/components/home/deadlines/DeadlineCard.vue";
import EditDeadlineDialog from "@/components/home/deadlines/EditDeadlineDialog.vue";
import { useThreadDeadlines, useUserAssignedDeadlines } from "@/composables/useDeadlines";
import { useCurrentScopeStore } from "@/stores/CurrentScopeStore";
import { parsePositiveRouteId } from "@/utils/route";

const route = useRoute();
const router = useRouter();
const scope = useCurrentScopeStore();

const threadId = computed(() => parsePositiveRouteId(route.query.thrId) ?? 0);
const showAssigned = computed(() => route.query.thrId === undefined);
const assigned = useUserAssignedDeadlines(showAssigned);
const scopedDeadlines = useThreadDeadlines(threadId);
const deadlines = computed(() => showAssigned.value ? assigned : scopedDeadlines);

const showCreateDeadlineButton = computed(() =>
  scope.thread?.id === threadId.value && scope.thread.permissions.createDeadlines,
);

const onCardClick = (deadline: DeadlineModel) => {
  router.push({ path: "/deadline", query: { ddlId: deadline.id } });
};
</script>

<template>
  <page-layout
    @card-clicked="onCardClick"
    :entity-card-component="DeadlineCard"
    :edit-dialog-component="EditDeadlineDialog"
    :create-dialog-component="CreateDeadlineDialog"
    :items="deadlines.items.value" :loading="deadlines.isLoading.value" :error="deadlines.error.value"
    :has-more="deadlines.hasNextPage.value" :load-more="deadlines.loadMore" :retry="deadlines.retry"
    :show-create-button="showCreateDeadlineButton"
    scope-type="deadline"
  />
</template>
