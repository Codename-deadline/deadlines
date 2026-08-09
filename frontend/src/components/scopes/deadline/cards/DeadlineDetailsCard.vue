<script setup lang="ts">
import { Calendar } from "@vicons/fa";
import { NCard, NCollapse, NCollapseItem, NDivider, NIcon } from 'naive-ui';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { MemberWithRole } from "@/api/schemas/common/Member";
import type { DeadlineWithRole } from '@/api/schemas/deadline/common/Deadline';
import ShortLongTimeDisplay from "@/components/home/common/ShortLongTimeDisplay.vue";
import SkeletonGrid from '@/components/home/common/SkeletonGrid.vue';
import UserAvatar from "@/components/home/common/UserAvatar.vue";
import DeadlineHeader from "@/components/home/deadlines/DeadlineHeader.vue";
import { useCurrentScopeStore } from "@/stores/CurrentScopeStore";
import { useLocalizationStore } from "@/stores/LocalizationStore";
import { computeDeadlineState } from "@/utils/state";
import DeadlineStatusButton from "../DeadlineStatusButton.vue";

const props = defineProps<{
  deadline: DeadlineWithRole,
  assignees: MemberWithRole[],
  isLoadingAssignees?: boolean,
  isLoadingStatusChange?: boolean
}>();
const emit = defineEmits<{
  statusChange: [currentStatus: boolean]
}>();

const { t } = useI18n();

const currentScopeStore = useCurrentScopeStore();
const localizationStore = useLocalizationStore();
const parentTitles = computed(() => {
  return { organization: currentScopeStore.organization?.title, thread: currentScopeStore.thread?.title }
})

const state = computed(() => computeDeadlineState(props.deadline));
</script>

<template>
  <n-card class="card">
    <header>
      <DeadlineHeader
        :deadline="deadline"
        :parent-titles="parentTitles"
        :icon-size="28"
        header-type="h1"
      />
    </header>
    <n-divider/>
    <div class="w-full grid grid-cols-1 gap-3 sm:gap-0 sm:grid-cols-[1fr_1fr]">
      <div
        class="description flex items-center space-x-2"
        :class="{ 'text-status-error/80 font-bold': state === 'overdue' }"
      >
        <NIcon :size="18">
          <Calendar/>
        </NIcon>
        <span class="flex space-x-1 font-medium">
          <span>{{ t("scopes.common.due") }}</span>
          <short-long-time-display
            :time="deadline.due"
            :time-zone="localizationStore.timeZone"
            :long-format="true"
          />
        </span>
      </div>
      <n-collapse>
        <n-collapse-item :title="`${t('scopes.deadline.assigned-to')} (${props.assignees.length})`" name="1">
          <div v-if="isLoadingAssignees" class="grid">
            <SkeletonGrid :show="isLoadingAssignees" :count="3" :card-height="32" />
          </div>
          <template v-else>
            <div
              v-for="assignee in assignees"
              :key="assignee.user.id"
            >
              <user-avatar :user="assignee.user"/>
            </div>
          </template>
        </n-collapse-item>
      </n-collapse>
    </div>
    <div v-if="deadline.permissions.update">
      <n-divider/>
      <div class="flex flex-col items-center">
        <DeadlineStatusButton
          @click="emit('statusChange', deadline.isCompleted)"
          :is-completed="deadline.isCompleted"
          :is-loading="isLoadingStatusChange"
        />
      </div>
    </div>
  </n-card>
</template>
