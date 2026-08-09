<script setup lang="ts">
import { NSkeleton } from "naive-ui";

defineProps<{
  show: boolean;
  count: number;
  cardHeight: number;
  gridClass?: string;
}>();
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="show"
      key="skeleton"
      class="z-10 col-start-1 row-start-1 grid gap-4 pointer-events-none"
      :class="gridClass ?? 'grid-cols-1'"
    >
      <div v-for="i in count" :key="i" :style="{ height: `${cardHeight}px` }">
        <n-skeleton height="100%" width="100%" :sharp="false" />
      </div>
    </div>
  </Transition>
</template>
