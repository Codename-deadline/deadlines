<script setup lang="ts">
import { type FormInst, type FormRules, NAlert, NButton, NCard, NForm, NFormItem, useMessage } from "naive-ui";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import type { OrganizationListModel } from "@/api/adapters/organization";
import UsernameInput from "@/components/home/common/forms/UsernameInput.vue";
import { useOrganizationMutations } from "@/composables/organizations/useOrganizationMutations";
import { useRequestError } from "@/composables/shared/useRequestError";
import { useCurrentUser } from "@/composables/users/useCurrentUser";
import { normalizeUsername } from "@/utils/validation";

const props = defineProps<{
  entity: OrganizationListModel;
}>();
const emit = defineEmits<{
  cancel: [];
  transferred: [];
}>();

const { t } = useI18n();
const message = useMessage();
const { ownership } = useOrganizationMutations();
const isTransferring = ownership.isLoading;
const displayError = useRequestError();
const { user } = useCurrentUser();

const formRef = ref<FormInst | null>(null);
const formModel = ref({ newOwnerUsername: "@" });
const formRules: FormRules = {
  newOwnerUsername: [
    {
      validator: (_, value: string) => Boolean(normalizeUsername(value)),
      renderMessage: () => t("scopes.organization.ownership.validation.username"),
      trigger: ["input", "blur"],
    },
    {
      validator: (_, value: string) =>
        normalizeUsername(value).toLowerCase() !== user.value?.username.toLowerCase(),
      renderMessage: () => t("scopes.organization.ownership.validation.self"),
      trigger: ["input", "blur"],
    },
  ],
};

const handleTransfer = () => {
  if (isTransferring.value) return;
  formRef.value?.validate(async (errors) => {
    if (errors) return;
    try {
      await ownership.mutateAsync({ organizationId: props.entity.id, changeOrganizationOwnerRequest: {
        newOwnerUsername: normalizeUsername(formModel.value.newOwnerUsername),
      } });
      message.success(t("scopes.organization.ownership.transferred"));
      emit("transferred");
    } catch (error) { displayError(error); }
  });
};
</script>

<template>
  <n-card :title="t('scopes.organization.ownership.title')" closable @close="emit('cancel')">
    <n-alert type="warning" :bordered="false" class="mb-4">
      {{ t("scopes.organization.ownership.warning") }}
    </n-alert>
    <n-form ref="formRef" :model="formModel" :rules="formRules">
      <n-form-item :label="t('scopes.organization.ownership.new-owner')" path="newOwnerUsername">
        <username-input
          v-model="formModel.newOwnerUsername"
          :organization-id="entity.id"
        />
      </n-form-item>
    </n-form>
    <div class="mt-4 flex justify-end gap-3">
      <n-button role="button" class="rounded-lg!" :disabled="isTransferring" @click="emit('cancel')">
        {{ t("actions.cancel") }}
      </n-button>
      <n-button role="button" type="error" class="rounded-lg!" :loading="isTransferring" @click="handleTransfer">
        {{ t("actions.transfer-org-ownership") }}
      </n-button>
    </div>
  </n-card>
</template>
