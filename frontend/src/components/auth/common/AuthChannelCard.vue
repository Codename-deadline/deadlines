<script setup lang="ts">
import { NButton, NQrCode, useMessage } from 'naive-ui';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Messenger } from '@/api/schemas/integration/MessengerAccount';
import emitter from '@/plugins/emitter';
import { useMetadataStore } from '@/stores/MetadataStore';
import { AuthMethod } from '@/types/api';
import AuthCard from './AuthCard.vue';

const props = defineProps<{
  authChannel: AuthMethod
}>();
const emit = defineEmits<{
  close: []
}>();
const message = useMessage();

const metadataStore = useMetadataStore();
const { metadata } = storeToRefs(metadataStore);

const { t } = useI18n();

const getMesssengerBot = (messenger: Messenger) => {
  const filteredBots = metadata.value.bots?.value.filter((bot) => bot.messenger === messenger);
  if (!filteredBots || filteredBots.length < 0) {
    message.error(t("errors.failed-to-resolve-bot"));
    return;
  }
  if (filteredBots.length > 1) {
    console.warn(`Broken invariant: ${filteredBots.length} registered instead of 0-1. Choosing the first one`);
  }
  return filteredBots[0];
}
const helperLink = computed(() => {
  switch (props.authChannel) {
    case AuthMethod.TELEGRAM:
      return `https://t.me/${getMesssengerBot("TELEGRAM")?.username}`
  }
})
</script>

<template>
<AuthCard
  @back="() => emitter.emit('resetAuthProgress')"
  :show-back-button="true"
  header-selector="auth.channels.bot.header"
  description-selector="auth.channels.bot.description"
>
  <template #body>
    <div class="flex flex-col items-center gap-3">
      <div class="bg-white flex p-2 rounded-lg">
        <n-qr-code class="p-0!" :value="helperLink" :size="128"/>
      </div>
      <a target="_blank" class="underline mb-1" :href="helperLink">{{ t('auth.channels.bot.link') }}</a>
      <n-button role="button" @click="emit('close')" type="info">{{ t('actions.continue') }}</n-button>
    </div>
  </template>
</AuthCard>
</template>
