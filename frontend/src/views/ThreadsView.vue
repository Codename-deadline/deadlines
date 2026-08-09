<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { ThreadWithRole } from '@/api/schemas/thread/common/Thread';
import { getMyThreads, getOrganizationThreads } from '@/api/thread';
import PageLayout from '@/components/home/common/PageLayout.vue';
import CreateThreadDialog from '@/components/home/threads/CreateThreadDialog.vue';
import EditThreadDialog from '@/components/home/threads/EditThreadDialog.vue';
import ThreadCard from '@/components/home/threads/ThreadCard.vue';
import { useCurrentScopeStore } from '@/stores/CurrentScopeStore';
import { parsePositiveRouteId } from '@/utils/route';

const router = useRouter();
const route = useRoute();
const currentScopeStore = useCurrentScopeStore();

const orgId = computed(() => parsePositiveRouteId(route.query.orgId));
const showCreateThreadButton = computed(
  () => currentScopeStore.organization?.id === orgId.value
    && currentScopeStore.organization.permissions.createThreads
);

const userThreadsFetcher = (page: number) => getMyThreads(page);
const organizationThreadFetcher = (page: number) => getOrganizationThreads(orgId.value!, page);
const threadFetcher = computed(() => orgId.value ? organizationThreadFetcher : userThreadsFetcher)

const onCardClick = (thread: ThreadWithRole) => {
  router.push({ path: '/deadlines', query: { thrId: thread.id } });
  currentScopeStore.withScope({ entity: thread, type: "thread" });
}
</script>

<template>
  <page-layout
    @card-clicked="onCardClick"
    :entity-card-component="ThreadCard"
    :edit-dialog-component="EditThreadDialog"
    :create-dialog-component="CreateThreadDialog"
    :fetcher="threadFetcher"
    :show-create-button="showCreateThreadButton"
    :reset="true"
    scope-type="thread"
  />
</template>
