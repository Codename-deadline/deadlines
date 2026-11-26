<script setup lang="ts">
import { Bell, CircleAlert, CircleCheck, CircleDot, Paperclip } from '@lucide/vue';
import { computed } from 'vue';
import type { EventModel } from '@/api/adapters/event';
import { computeEventState } from '@/utils/state';
import RoleTag from '../common/RoleTag.vue';
import ScopeHierarchy from '../common/ScopeHierarchy.vue';
import DeadlineStateTag from './DeadlineStateTag.vue';

const props = withDefaults(
  defineProps<{
    deadline: EventModel
    parentTitles?: { organization?: string, thread?: string },
    headerType: "h1" | "h3"
    iconSize?: number
  }>(),
  {
    iconSize: 24
  }
);

const state = computed(() => computeEventState(props.deadline))
const stateIcons = { open: CircleDot, overdue: CircleAlert, completed: CircleCheck, upcoming: Bell, occurred: Bell };
const stateColors = {
  open: "text-status-success/75",
  overdue: "text-status-error/80",
  completed: "text-status-info/75",
  upcoming: "text-status-info/75",
  occurred: "text-status-info/75",
};
</script>

<template>
  <div
    class="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2 gap-y-1 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-y-0"
  >
    <component :is="stateIcons[state]" class="shrink-0" :class="stateColors[state]" :size="iconSize" />

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
