<script setup lang="ts" generic="T extends {id: number}">
import { useWindowSize } from "@vueuse/core";
import type { Component } from "vue";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import type { PagedResponse } from "@/api/common/PaginationResponse";
import { useInfiniteVirtualList } from "@/composables/useInfiniteVirtualList";
import { CARD_HEIGHT_PIXELS, PRELOAD_DISTANCE_PIXELS } from "@/constants/virtualList";
import { tEntitiesNotFound } from "@/locales/utils";
import emitter from "@/plugins/emitter";
import type { ListType } from "@/stores/InfiniteListStore";
import type { SafeApiCall } from "@/types/api";
import type { ScopeType } from "@/types/scope";
import GlobalFooter from "./GlobalFooter.vue";
import GlobalHeader from "./GlobalHeader.vue";
import SectionHeader from "./SectionHeader.vue";
import SkeletonGrid from "./SkeletonGrid.vue";

const emit = defineEmits<{
  cardClicked: [entity: T]
}>();

const props = withDefaults(
  defineProps<{
    entityCardComponent: Component;
    editDialogComponent: Component;
    createDialogComponent?: Component;
    fetcher: (page: number) => Promise<SafeApiCall<PagedResponse<T>>>;
    scopeType: ScopeType;
    showCreateButton?: boolean;
    reset?: boolean;
    itemHeight?: number;
    distance?: number;
  }>(),
  {
    showCreateButton: true,
    reset: false,
    itemHeight: CARD_HEIGHT_PIXELS,
    distance: PRELOAD_DISTANCE_PIXELS,
  },
);
const { t } = useI18n();
const { width } = useWindowSize();
// These values are linked to the CSS below
// grid grid-cols-1... needs to be adjusted on change
const itemsPerRow = computed<number>(() => {
  if (width.value >= 1280) return 3;
  if (width.value >= 640) return 2;
  return 1;
});
const cardHeight = computed<number>(() => {
  switch (props.scopeType) {
    case "organization": return 211;
    case "thread": return 179;
    case "deadline": return 128;
  }
});

const objectToEdit = ref<any>(null);
const isCreatingEntity = ref<boolean>(false);
const isDialogOpen = computed(() => objectToEdit.value !== null || isCreatingEntity.value)

emitter.on("openCreateEntityDialog", () => {
  isCreatingEntity.value = true;
});
emitter.on("closeCreateEntityDialog", () => {
  isCreatingEntity.value = false;
});
emitter.on("closeEditEntityDialog", () => {
  objectToEdit.value = null;
});

const closeAllDialogs = () => {
  objectToEdit.value = null;
  isCreatingEntity.value = false;
};
const scopeTypeToListType = (scopeType: ScopeType): ListType => {
  switch (scopeType) {
    case "organization":
      return "organizations";
    case "thread":
      return "threads";
    case "deadline":
      return "deadlines";
  }
};

const { containerProps, wrapperProps, virtualItems, showSkeleton, $reset } = useInfiniteVirtualList(
  scopeTypeToListType(props.scopeType),
  (page: number) => props.fetcher(page),
  {
    itemsPerRow,
    itemHeight: props.itemHeight,
    distance: props.distance,
  },
);

watch(() => props.reset, (value) => {
  if (value) $reset();
}, { immediate: true });
</script>

<template>
  <section class="landscape-mobile:flex landscape-mobile:justify-center">
    <global-header class="mt"/>
    <div class="
      mt-4 sm:mt-8 layout-dynamic-padding
      landscape-mobile:w-8/10
    ">
      <section-header
        :section="scopeType"
        :show-create-button="showCreateButton"
        button-action="create"
      />
      <div class="
        mt-6 grid
        landscape-mobile:mb-4 landscape-mobile:h-[90vh]
      ">
        <div v-bind="containerProps" class="overflow-y-auto h-full pb-14 col-start-1 row-start-1">
          <div v-bind="wrapperProps" class="space-y-4">
            <div
              class="
                grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4
                landscape-mobile:grid-cols-1
              "
              v-for="row in virtualItems"
              :key="row.index"
            >
              <component
                role="button"
                :is="props.entityCardComponent"
                @click="emit('cardClicked', item)"
                @edit="objectToEdit = item"
                v-for="item in row.data"
                :key="item.id"
                :entity="item"
              />
            </div>
          </div>
          <div v-if="!showSkeleton && virtualItems.length === 0" class="w-full flex flex-col justify-center items-center description py-10">
            {{ tEntitiesNotFound(t, `scopes.${scopeType}.header`) }}
          </div>
        </div>
        <SkeletonGrid
          :show="showSkeleton"
          :count="itemsPerRow * 3"
          :card-height="cardHeight"
          grid-class="
            grid-cols-1 sm:grid-cols-2 xl:grid-cols-3
            landscape-mobile:grid-cols-1
          "
        />
      </div>
    </div>
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100 backdrop-blur-sm"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isDialogOpen"
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <button
          type="button"
          class="absolute inset-0 bg-black/30 backdrop-blur-sm"
          @click="closeAllDialogs"
        />
  
        <component
          :is="props.editDialogComponent"
          v-if="objectToEdit"
          class="relative min-w-1/3! w-fit! h-fit! rounded-xl!"
          :entity="objectToEdit"
        />
        <component
          :is="props.createDialogComponent"
          v-if="isCreatingEntity && props.createDialogComponent"
          class="relative min-w-1/3! w-fit! h-fit! rounded-xl!"
        />
      </div>
    </Transition>
    <global-footer/>
  </section>
</template>
