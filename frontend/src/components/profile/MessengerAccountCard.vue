<script setup lang="ts">
import { Telegram, TrashAlt } from "@vicons/fa";
import { NButton, NCard, NIcon, NPopconfirm } from "naive-ui";
import { useI18n } from "vue-i18n";
import type { MessengerAccount } from "@/api/schemas/integration/MessengerAccount";

const props = defineProps<{
  account: MessengerAccount;
  unlinking?: boolean;
}>();
const emit = defineEmits<{
  unlink: [account: MessengerAccount];
}>();

const { t } = useI18n();
</script>

<template>
  <n-card size="small" class="card">
    <div class="flex items-center justify-between gap-4">
      <div class="flex min-w-0 items-center gap-3">
        <n-icon size="24" class="shrink-0">
          <telegram v-if="account.messenger === 'TELEGRAM'" />
        </n-icon>
        <span class="truncate font-medium">{{ account.accountId }}</span>
      </div>
      <n-popconfirm @positive-click="emit('unlink', props.account)">
        <template #trigger>
          <n-button
            role="button"
            type="error"
            quaternary
            :loading="unlinking"
            :aria-label="t('profile.accounts.unlink')"
          >
            <template #icon>
              <n-icon><trash-alt /></n-icon>
            </template>
          </n-button>
        </template>
        {{ t("profile.accounts.unlink-confirmation") }}
      </n-popconfirm>
    </div>
  </n-card>
</template>
