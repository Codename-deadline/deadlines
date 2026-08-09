<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getMyDeadlines, getThreadDeadlines } from '@/api/deadline';
import type { DeadlineWithRole } from '@/api/schemas/deadline/common/Deadline';
import PageLayout from '@/components/home/common/PageLayout.vue';
import CreateDeadlineDialog from '@/components/home/deadlines/CreateDeadlineDialog.vue';
import DeadlineCard from '@/components/home/deadlines/DeadlineCard.vue';
import EditDeadlineDialog from '@/components/home/deadlines/EditDeadlineDialog.vue';
import { useCurrentScopeStore } from '@/stores/CurrentScopeStore';
import { parsePositiveRouteId } from '@/utils/route';

const route = useRoute();
const router = useRouter();
const currentScopeStore = useCurrentScopeStore();

const thrId = computed(() => parsePositiveRouteId(route.query.thrId));
const showCreateDeadlineButton = computed(
  () => currentScopeStore.thread?.id === thrId.value
    && currentScopeStore.thread.permissions.createDeadlines
);


const userDeadlineFetcher = (page: number) => getMyDeadlines(page);
const threadDeadlinesFetcher = (page: number) => getThreadDeadlines(thrId.value!, page);
const deadlineFetcher = computed(() => thrId.value ? threadDeadlinesFetcher : userDeadlineFetcher)

const onCardClick = (deadline: DeadlineWithRole) => {
  router.push({ path: '/deadline', query: { ddlId: deadline.id } });
  currentScopeStore.withScope({ entity: deadline, type: "deadline" });
}
</script>

<template>
  <page-layout
    @card-clicked="onCardClick"
    :entity-card-component="DeadlineCard"
    :edit-dialog-component="EditDeadlineDialog"
    :create-dialog-component="CreateDeadlineDialog"
    :fetcher="deadlineFetcher"
    :show-create-button="showCreateDeadlineButton"
    :reset="true"
    scope-type="deadline"
  />
</template>
