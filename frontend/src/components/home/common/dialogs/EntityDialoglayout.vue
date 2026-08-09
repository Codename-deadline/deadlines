<script setup lang="ts">
import { NCard, NTabs } from 'naive-ui';
import { provide } from 'vue';
import { DEFAULT_MEMBERS_PAGE_SIZE } from '@/constants/defaults';
import { PAGE_SIZE_KEY, SCOPE_TYPE_KEY } from '@/constants/providerKeys';
import emitter from '@/plugins/emitter';
import type { ScopeType } from '@/types/scope';

const props = withDefaults(
  defineProps<{
    scopeType: ScopeType;
    title: string;
    usersToLoad?: number;
  }>(),
  {
    usersToLoad: DEFAULT_MEMBERS_PAGE_SIZE,
  }
);

provide(PAGE_SIZE_KEY, props.usersToLoad);
provide(SCOPE_TYPE_KEY, props.scopeType);
</script>

<template>
  <n-card class="min-w-[95vw]! sm:min-w-fit!" :title="title" closable @close="emitter.emit('closeEditEntityDialog')">
    <n-tabs justify-content="space-evenly">
      <slot />
    </n-tabs>
  </n-card>
</template>
