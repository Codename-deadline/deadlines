<script setup lang="ts">
import { type FormInst, type FormRules, NButton, NCard, NForm, NFormItem, NInput, NSelect, useMessage } from "naive-ui";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { linkMessengerAccount } from "@/api/integration/accounts";
import { type Messenger, MessengerSchema } from "@/api/schemas/integration/MessengerAccount";
import { useApi } from "@/composables/useApi";
import { useLoading } from "@/composables/useLoading";
import { isDigitOnlySequence } from "@/utils/validation";

const emit = defineEmits<{
  close: [];
}>();

const { t } = useI18n();
const message = useMessage();
const { makeRequest } = useApi();
const { isLoading: isLinking, withLoading } = useLoading();

const formRef = ref<FormInst | null>(null);
const formModel = ref<{ accountId: string; messenger: Messenger }>({
  accountId: "",
  messenger: "TELEGRAM",
});
const formRules: FormRules = {
  accountId: [
    {
      required: true,
      renderMessage: () => t("profile.accounts.validation.account-required"),
      trigger: ["input", "blur"],
    },
    {
      validator: (_, value: string) => {
        if (!value || !isDigitOnlySequence(value)) return false;
        const accountId = Number(value);
        return Number.isSafeInteger(accountId) && accountId > 0;
      },
      renderMessage: () => t("profile.accounts.validation.account-invalid"),
      trigger: ["input", "blur"],
    },
  ],
  messenger: [
    {
      required: true,
      renderMessage: () => t("profile.accounts.validation.messenger-required"),
      trigger: ["change"],
    },
  ],
};

const messengerOptions = computed(() =>
  MessengerSchema.options.map((messenger) => ({
    label: t(`profile.accounts.messengers.${messenger.toLowerCase()}`),
    value: messenger,
  })),
);

const handleLink = () => {
  formRef.value?.validate(async (errors) => {
    if (errors) return;

    const response = await withLoading(() =>
      makeRequest(() =>
        linkMessengerAccount({
          accountId: Number(formModel.value.accountId),
          messenger: formModel.value.messenger,
        }),
      ),
    );
    if (!response.ok) return;

    message.success(t("profile.accounts.confirmation-sent"));
    emit("close");
  });
};
</script>

<template>
  <n-card :title="t('profile.accounts.link-title')" closable @close="emit('close')">
    <n-form ref="formRef" :model="formModel" :rules="formRules">
      <n-form-item :label="t('profile.accounts.messenger')" path="messenger">
        <n-select v-model:value="formModel.messenger" :options="messengerOptions" class="rounded-lg!" />
      </n-form-item>
      <n-form-item :label="t('profile.accounts.account-id')" path="accountId">
        <n-input v-model:value="formModel.accountId" inputmode="numeric" class="rounded-lg!" />
      </n-form-item>
    </n-form>
    <div class="mt-4 flex justify-end">
      <n-button role="button" type="info" class="rounded-lg!" :loading="isLinking" @click="handleLink">
        {{ t("profile.accounts.link") }}
      </n-button>
    </div>
  </n-card>
</template>
