<script setup lang="ts">
import { Plus } from "@vicons/fa";
import { Icon } from "@vicons/utils";
import { NButton } from "naive-ui";
import { useI18n } from "vue-i18n";
import emitter from "@/plugins/emitter";
import type { ScopeType } from "@/types/scope";

const props = defineProps<{
  section: ScopeType | "invitation";
  buttonAction: string;
  showCreateButton: boolean
}>();

const { t } = useI18n();
</script>

<template>
  <header class="flex flex-col w-full sm:flex-row sm:justify-between sm:items-center">
    <div>
      <h2>{{ t(`scopes.${section}.header`) }}</h2>
      <div class="description">{{ t(`scopes.${section}.description`) }}</div>
    </div>
    <div class="mt-3 sm:mt-0">
      <n-button
        role="button"
        v-if="showCreateButton"
        @click="emitter.emit('openCreateEntityDialog')"
        type="info"
        class="rounded-lg! w-full! sm:w-fit"
      >
        <template #icon>
        <Icon>
          <Plus/>
        </Icon>
        </template>
        {{ t(`actions.${buttonAction}`) }}
      </n-button>
    </div>
  </header>
</template>
