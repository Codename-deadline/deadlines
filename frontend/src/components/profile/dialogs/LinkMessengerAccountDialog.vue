<script setup lang="ts">
import { type FormInst, type FormRules, NButton, NCard, NForm, NFormItem, NInput, NSelect, useMessage } from "naive-ui";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { LinkMessengerAccountRequestMessenger } from "@/api/generated/models";
import { useLinkMessengerAccount } from "@/composables/useLinkedAccounts";
import { useRequestError } from "@/composables/useRequestError";
import { isDigitOnlySequence } from "@/utils/validation";

const emit = defineEmits<{
  close: [];
}>();

const { t } = useI18n();
const message = useMessage();
const { mutateAsync: linkAccount, isLoading: isLinking } = useLinkMessengerAccount();
const displayRequestError = useRequestError();

const formRef = ref<FormInst | null>(null);
const formModel = ref<{ accountId: string; messenger: LinkMessengerAccountRequestMessenger }>({
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
  Object.values(LinkMessengerAccountRequestMessenger).map((messenger) => ({
    label: t(`profile.accounts.messengers.${messenger.toLowerCase()}`),
    value: messenger,
  })),
);

const handleLink = () => {
  if (isLinking.value) return;
  formRef.value?.validate(async (errors) => {
    if (errors) return;

    try {
      await linkAccount({
        linkMessengerAccountRequest: {
          accountId: Number(formModel.value.accountId),
          messenger: formModel.value.messenger,
        },
      });
      message.success(t("profile.accounts.confirmation-sent"));
      emit("close");
    } catch (error) {
      displayRequestError(error);
    }
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
