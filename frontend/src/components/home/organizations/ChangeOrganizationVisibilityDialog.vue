<script setup lang="ts">
import { NAlert, NButton, NCard, NSelect, useMessage } from "naive-ui";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { changeOrganizationVisibility } from "@/api/organization";
import type { OrganizationWithStatsAndRole } from "@/api/schemas/organization/common/Organization";
import {
  type OrganizationType,
  OrganizationTypeSchema,
} from "@/api/schemas/organization/common/OrganizationType";
import { useApi } from "@/composables/useApi";
import { useLoading } from "@/composables/useLoading";

const props = defineProps<{
  entity: OrganizationWithStatsAndRole;
}>();
const emit = defineEmits<{
  cancel: [];
  changed: [type: OrganizationType];
}>();

const { t } = useI18n();
const message = useMessage();
const { makeRequest } = useApi();
const { isLoading: isSaving, withLoading } = useLoading();

const selectedType = ref<OrganizationType>(props.entity.type);
const isUnchanged = computed(() => selectedType.value === props.entity.type);
const visibilityOptions = computed(() =>
  OrganizationTypeSchema.options.map((type) => ({
    value: type,
    label: t(`scopes.organization.type.${type.toLowerCase()}`),
  })),
);

const handleSave = async () => {
  if (isUnchanged.value) return;

  const response = await withLoading(() =>
    makeRequest(() => changeOrganizationVisibility(props.entity.id, { type: selectedType.value })),
  );
  if (!response.ok) return;

  message.success(t("scopes.organization.visibility.updated"));
  emit("changed", selectedType.value);
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
