<script setup lang="ts">
import { CalendarAlt, Cog, UserFriends } from "@vicons/fa";
import { NButton } from "naive-ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { DeadlineWithRole } from "@/api/schemas/deadline/common/Deadline";
import { useLocalizationStore } from "@/stores/LocalizationStore";
import { hasAnyEditPermission } from "@/utils/permissions";
import { computeDeadlineState } from "@/utils/state";
import EntityCard from "../common/EntityCard.vue";
import ShortLongTimeDisplay from "../common/ShortLongTimeDisplay.vue";
import DeadlineHeader from "./DeadlineHeader.vue";

const { t } = useI18n();
const localizationStore = useLocalizationStore();

const props = defineProps<{
  entity: DeadlineWithRole;
}>();
const emit = defineEmits<{
  edit: [id: number];
}>();

const state = computed(() => computeDeadlineState(props.entity));
</script>

<template>
  <entity-card>
    <template #header>
      <div class="flex min-w-0 w-full justify-between items-center">
        <DeadlineHeader :deadline="entity" header-type="h3"/>
        <div class="flex shrink-0 space-x-3 ml-3">
          <n-button role="button" v-if="hasAnyEditPermission(entity.permissions)" @click.stop="emit('edit', entity.id)" text>
            <template #icon>
              <icon class="">
                <Cog/>
              </icon>
            </template>
          </n-button>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="w-full flex justify-between items-center">
        <div class="flex items-center" :class="{ 'text-status-error/80 font-bold': state === 'overdue' }">
          <icon class="mr-2" size="16">
            <CalendarAlt />
          </icon>
          <short-long-time-display
            :time="entity.due"
            :time-zone="localizationStore.timeZone"
          />
        </div>
        <div class="flex items-center">
          <icon class="mr-2" size="16">
            <UserFriends />
          </icon>
          {{ entity.stats.assignees }} {{ t('scopes.common.assignees').toLowerCase() }}
        </div>
      </div>
    </template>
  </entity-card>
</template>
