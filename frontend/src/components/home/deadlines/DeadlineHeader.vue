<script setup lang="ts">
import { CircleAlert, CircleCheck, CircleDot, Paperclip } from '@lucide/vue';
import { computed } from 'vue';
import type { DeadlineWithRole } from '@/api/schemas/deadline/common/Deadline';
import { computeDeadlineState } from '@/utils/state';
import RoleTag from '../common/RoleTag.vue';
import ScopeHierarchy from '../common/ScopeHierarchy.vue';
import DeadlineStateTag from './DeadlineStateTag.vue';

const props = withDefaults(
  defineProps<{
    deadline: DeadlineWithRole
    parentTitles?: { organization?: string, thread?: string },
    headerType: "h1" | "h3"
    iconSize?: number
  }>(),
  {
    iconSize: 24
  }
);

const state = computed(() => computeDeadlineState(props.deadline))
</script>

<template>
  <div
    class="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2 gap-y-1 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-y-0"
  >
    <CircleDot v-if="state === 'open'" class="shrink-0 text-status-success/75" :size="iconSize" />
    <CircleAlert v-else-if="state === 'overdue'" class="shrink-0 text-status-error/80" :size="iconSize" />
    <CircleCheck v-else class="shrink-0 text-status-info/75" :size="iconSize" />

    <component
      :is="headerType"
      class="min-w-0 overflow-x-auto whitespace-nowrap"
      :class="{ 'description line-through': state === 'completed' }"
    >
      {{ deadline.title }}
    </component>

    <div class="col-start-2 row-start-2 flex items-center gap-2 sm:col-start-3 sm:row-start-1">
      <deadline-state-tag class="shrink-0" :state="state" />
      <role-tag class="shrink-0" scope-type="deadline" :scope-role="deadline.role" />
      <Paperclip v-if="deadline.stats.attachments > 0" class="description shrink-0" :size="16" />
    </div>

    <ScopeHierarchy
      class="col-start-2"
      :scope-id="deadline.id"
      :organization-title="parentTitles?.organization"
      :thread-title="parentTitles?.thread"
    />
  </div>
</template>
