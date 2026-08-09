<script setup lang="ts">
import { type FormInst, type FormRules, NAlert, NButton, NCard, NForm, NFormItem, useMessage } from "naive-ui";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { getOrganizationMembersWithUsernameStartingWith } from "@/api/organization";
import { changeOrganizationOwner } from "@/api/roles";
import type { OrganizationWithStatsAndRole } from "@/api/schemas/organization/common/Organization";
import UsernameInput from "@/components/home/common/forms/UsernameInput.vue";
import { useApi } from "@/composables/useApi";
import { useLoading } from "@/composables/useLoading";
import { useUserStore } from "@/stores/UserStore";
import { normalizeUsername } from "@/utils/validation";

const props = defineProps<{
  entity: OrganizationWithStatsAndRole;
}>();
const emit = defineEmits<{
  cancel: [];
  transferred: [];
}>();

const { t } = useI18n();
const message = useMessage();
const { makeRequest } = useApi();
const { isLoading: isTransferring, withLoading } = useLoading();
const userStore = useUserStore();

const formRef = ref<FormInst | null>(null);
const formModel = ref({ newOwnerUsername: "@" });
const formRules: FormRules = {
  newOwnerUsername: [
    {
      renderMessage: () => t("scopes.organization.ownership.validation.username"),
      trigger: ["input", "blur"],
    },
    {
      validator: (_, value: string) =>
        normalizeUsername(value).toLowerCase() !== userStore.user?.username.toLowerCase(),
      renderMessage: () => t("scopes.organization.ownership.validation.self"),
      trigger: ["input", "blur"],
    },
  ],
};

const fetchOrganizationMembers = (startsWith: string) =>
  getOrganizationMembersWithUsernameStartingWith(props.entity.id, startsWith);

const handleTransfer = () => {
  formRef.value?.validate(async (errors) => {
    if (errors) return;

    const response = await withLoading(() =>
      makeRequest(() =>
        changeOrganizationOwner(props.entity.id, {
          newOwnerUsername: normalizeUsername(formModel.value.newOwnerUsername),
        }),
      ),
    );
    if (!response.ok) return;

    message.success(t("scopes.organization.ownership.transferred"));
    emit("transferred");
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
          :usernames-fetcher="fetchOrganizationMembers"
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
