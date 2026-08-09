<script setup lang="ts">
import { Telegram as TelegramIcon } from "@vicons/fa";
import { NButton } from "naive-ui";
import { type Component, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import AuthCard from "@/components/auth/common/AuthCard.vue";
import AuthMethodButton from "@/components/auth/common/AuthMethodButton.vue";
import { AuthMethod } from "@/types/api";

const emit = defineEmits<{
  channelSelected: [ method: AuthMethod]
}>();

const isSignUp = defineModel<boolean>("is-sign-up", { required: true });
const currentMethod = ref<AuthMethod | null>(null);
const methodIcons: Record<AuthMethod, Component> = {
  [AuthMethod.TELEGRAM]: TelegramIcon,
};

const { t } = useI18n();

watch(currentMethod, (newMethod) => {
  if (!newMethod || !Object.keys(methodIcons).includes(newMethod)) {
    // TODO: Toast error message
    console.error("Invalid method:", newMethod);
    return;
  }

  emit("channelSelected", newMethod);
});
</script>

<template>
  <AuthCard description-selector="auth.description">
    <template v-slot:body>
      <div class="flex justify-center">
        <AuthMethodButton
          v-model="currentMethod"
          v-for="method in Object.values(AuthMethod)"
          :key="method"
          :method="method"
          :icon="methodIcons[method]"
          class="w-full! rounded-lg!"
        />
      </div>
    </template>
    <template v-slot:footer>
      <small class="flex justify-center mt-6">
        <div class="space-x-1 text-center" v-if="!isSignUp">
          <span>{{ t("auth.sign-in.notRegistered") }}</span>
          <n-button role="button" text size="tiny" @click="isSignUp = true">
            <span class="underline">{{ t("auth.sign-up.action") }}</span>
          </n-button>
        </div>
        <div class="space-x-1 text-center" v-else>
          <span>{{ t("auth.sign-up.alreadyRegistered") }}</span>
          <n-button role="button" text tag="a" size="tiny" @click="isSignUp = false">
            <span class="underline">{{ t("auth.sign-in.action") }}</span>
          </n-button>
        </div>
      </small>
    </template>
  </AuthCard>
</template>
