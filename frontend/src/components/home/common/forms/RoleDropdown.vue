<script setup lang="ts">
import { NButton, NDropdown } from 'naive-ui';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { AnyRole } from '@/api/common/AnyRole';
import { SCOPE_TYPE_KEY } from '@/constants/providerKeys';
import { extractRoleFromString } from '@/locales/utils';
import { useMetadataStore } from '@/stores/MetadataStore';
import type { ScopeType } from '@/types/scope';
import { injectOrThrow, isRoleInScope } from '@/utils';

const props = withDefaults(
  defineProps<{
  buttonRole?: AnyRole;
  disabled?: boolean;
  filter?: (role: AnyRole, scopeType: ScopeType) => boolean;
  size?: "small" | "medium";
}>(),
  {
    size: "small",
    disabled: false,
  },
);

// update:modelValue will perhaps be added in the future
const emit = defineEmits<{
  select: [role: AnyRole]
}>();

const { t } = useI18n();
const scopeType = injectOrThrow(SCOPE_TYPE_KEY);

const metadataStore = useMetadataStore();
const roles = computed(() => metadataStore.metadata.roles?.value.roles);

const filteredRoles = computed(() => {
  const scopeFilteredRoles = roles.value?.filter((role) => isRoleInScope(role, scopeType)) ?? [];
  const withCustomFilter = props.filter ? scopeFilteredRoles.filter((role) => props.filter?.(role, scopeType)) : scopeFilteredRoles;

  return withCustomFilter.map((role) => ({
    label: t(extractRoleFromString(scopeType, role)), key: role
  }));
});
</script>

<template>
  <n-dropdown
    @select="(role: AnyRole) => emit('select', role)"
    :options="filteredRoles"
    trigger="click"
  >
    <n-button :disabled="disabled" class="rounded-lg! capitalize" :size="size">
      {{ t(extractRoleFromString(scopeType, buttonRole ?? filteredRoles[0].key ?? "")) }}
    </n-button>
  </n-dropdown>
</template>
