<script setup lang="ts">
import { NAlert, NButton, NCard, NSelect, useMessage } from "naive-ui";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import type { OrganizationListModel } from "@/api/adapters/organization";
import { OrganizationResponseType } from "@/api/generated/models";
import { useOrganizationMutations } from "@/composables/useOrganizationMutations";
import { useRequestError } from "@/composables/useRequestError";

const props = defineProps<{
  entity: OrganizationListModel;
}>();
const emit = defineEmits<{
  cancel: [];
  changed: [type: OrganizationResponseType];
}>();

const { t } = useI18n();
const message = useMessage();
const { visibility } = useOrganizationMutations();
const isSaving = visibility.isLoading;
const displayError = useRequestError();

const selectedType = ref<OrganizationResponseType>(props.entity.type);
const isUnchanged = computed(() => selectedType.value === props.entity.type);
const visibilityOptions = computed(() =>
  Object.values(OrganizationResponseType).map((type) => ({
    value: type,
    label: t(`scopes.organization.type.${type.toLowerCase()}`),
  })),
);

const handleSave = async () => {
  if (isUnchanged.value || isSaving.value) return;
  const type = selectedType.value;
  try {
    await visibility.mutateAsync({ organizationId: props.entity.id, changeOrganizationVisibilityRequest: { type } });
    message.success(t("scopes.organization.visibility.updated"));
    emit("changed", type);
  } catch (error) {
    displayError(error);
  }
};
</script>

<template>
  <n-card :title="t('scopes.organization.visibility.title')" closable @close="emit('cancel')">
    <n-alert :type="selectedType === 'PERSONAL' ? 'warning' : 'info'" :bordered="false" class="mb-4">
      {{ t(`scopes.organization.visibility.description.${selectedType.toLowerCase()}`) }}
    </n-alert>
    <div>
      <p class="mb-2 text-sm font-medium">{{ t("scopes.common.form-labels.visibility") }}</p>
      <n-select v-model:value="selectedType" :options="visibilityOptions" />
    </div>
    <div class="mt-4 flex justify-end gap-3">
      <n-button role="button" class="rounded-lg!" :disabled="isSaving" @click="emit('cancel')">
        {{ t("actions.cancel") }}
      </n-button>
      <n-button
        role="button"
        type="info"
        class="rounded-lg!"
        :disabled="isUnchanged"
        :loading="isSaving"
        @click="handleSave"
      >
        {{ t("actions.save") }}
      </n-button>
    </div>
  </n-card>
</template>
