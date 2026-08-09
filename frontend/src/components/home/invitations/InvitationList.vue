<script setup lang="ts">
import { type UseVirtualListItem, useWindowSize } from "@vueuse/core";
import { computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import type { PagedResponse } from "@/api/common/PaginationResponse";
import type { OrganizationInvitation } from "@/api/schemas/organization/invitation/Invitation";
import SkeletonGrid from "@/components/home/common/SkeletonGrid.vue";
import { useInfiniteVirtualList } from "@/composables/useInfiniteVirtualList";
import { tEntitiesNotFound } from "@/locales/utils";
import type { SafeApiCall } from "@/types/api";
import InvitationCard from "./InvitationCard.vue";

const props = defineProps<{
  variant: "received" | "sent";
  fetcher: (page: number) => Promise<SafeApiCall<PagedResponse<OrganizationInvitation>>>;
  reset?: boolean
}>();

const { t } = useI18n();
const { width } = useWindowSize();
const CARD_HEIGHT = 179;

const itemsPerRow = computed(() => {
  if (width.value >= 640) return 2;
  return 1;
});

const listType = props.variant === "received" ? "invitations_received" : "invitations_sent";

const { containerProps, wrapperProps, virtualItems, showSkeleton, $reset } =
  useInfiniteVirtualList<OrganizationInvitation>(listType, props.fetcher, {
    itemsPerRow,
    itemHeight: CARD_HEIGHT,
  });

const items = computed<UseVirtualListItem<OrganizationInvitation[]>[]>(
  () => virtualItems.value as UseVirtualListItem<OrganizationInvitation[]>[],
);

watch(() => props.reset, (value) => {
  if (value) $reset();
}, { immediate: true });
</script>

<template>
  <div class="grid">
    <div
      v-bind="containerProps"
      class="overflow-y-auto col-start-1 row-start-1"
      :class="{ 'h-[65vh] landscape-mobile:h-[90vh]': items.length > 0 }"
    >
      <div v-bind="wrapperProps" class="space-y-4">
        <div
          class="
            grid grid-cols-1 md:grid-cols-2 gap-4
            landscape-mobile:grid-cols-1
          "
          v-for="row in items"
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
      <div
        v-if="!showSkeleton && items.length === 0"
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
