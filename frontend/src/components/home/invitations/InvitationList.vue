<script setup lang="ts">
import { useWindowSize } from "@vueuse/core";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import QueryError from "@/components/home/common/QueryError.vue";
import SkeletonGrid from "@/components/home/common/SkeletonGrid.vue";
import { useInfiniteVirtualList } from "@/composables/useInfiniteVirtualList";
import { useReceivedInvitations, useSentInvitations } from "@/composables/useInvitations";
import { tEntitiesNotFound } from "@/locales/utils";
import InvitationCard from "./InvitationCard.vue";

const props = defineProps<{ variant: "received" | "sent" }>();
const { t } = useI18n();

// The view keys this component by variant; each direction retains its own cached pages.
const invitations = props.variant === "received" ? useReceivedInvitations() : useSentInvitations();
const { width } = useWindowSize();
const itemsPerRow = computed(() => width.value >= 640 ? 2 : 1);
const CARD_HEIGHT = 179;

const { containerProps, wrapperProps, virtualItems } = useInfiniteVirtualList(invitations.items, {
  itemsPerRow,
  itemHeight: CARD_HEIGHT,
  loading: invitations.isLoading,
  hasMore: invitations.hasNextPage,
  error: invitations.error,
  loadMore: invitations.loadMore,
});

const showSkeleton = computed(() => invitations.isLoading.value && invitations.items.value.length === 0);
</script>

<template>
  <div class="grid">
    <div
      v-bind="containerProps"
      class="overflow-y-auto col-start-1 row-start-1"
      :class="{ 'h-[65vh] landscape-mobile:h-[90vh]': invitations.items.value.length > 0 }"
    >
      <div v-bind="wrapperProps" class="space-y-4">
        <div
          class="
            grid grid-cols-1 md:grid-cols-2 gap-4
            landscape-mobile:grid-cols-1
          "
          v-for="row in virtualItems"
          :key="row.index"
        >
          <InvitationCard
            v-for="item in row.data"
            :key="item.id"
            :variant="variant"
            :invitation="item"
          />
        </div>
      </div>
      <QueryError :error="invitations.error.value" :loading="invitations.isLoading.value" @retry="invitations.retry()" />
      <div
        v-if="!showSkeleton && !invitations.error.value && invitations.items.value.length === 0"
        class="w-full flex flex-col justify-center items-center description py-10"
      >
        {{ tEntitiesNotFound(t, "scopes.invitation.header") }}
      </div>
    </div>
    <SkeletonGrid
      :show="showSkeleton"
      :count="itemsPerRow * 3"
      :card-height="CARD_HEIGHT"
      grid-class="grid-cols-1 md:grid-cols-2"
    />
  </div>
</template>
