<script setup lang="ts">
import { Envelope } from '@vicons/fa';
import { NButton, NIcon } from 'naive-ui';
import type { AnyRole } from '@/api/common/AnyRole';
import RoleDropdown from './RoleDropdown.vue';
import UsernameInput from './UsernameInput.vue';

const props = withDefaults(
  defineProps<{
    organizationId?: number;
    showInvitationButton?: boolean;
    isLoading?: boolean;
  }>(),
  {
    showInvitationButton: false,
  },
);

const emit = defineEmits<{
  click: [];
}>();

const modelUsername = defineModel<string>("username", { required: true });
const modelRole = defineModel<AnyRole>("role", { required: true });

const handleClick = (e: MouseEvent) => {
  e.preventDefault();
  emit('click');
}
</script>

<template>
  <div class="flex space-x-1! flex-1">
    <username-input v-model="modelUsername" :organization-id="organizationId" />
    <RoleDropdown
      @select="(role: AnyRole) => modelRole = role"
      :button-role="modelRole"
      :filter="(role: AnyRole) => !role.endsWith('OWNER')"
      size="medium"
    />
    <n-button role="button" v-if="showInvitationButton" :loading="isLoading" :disabled="isLoading" @click="handleClick" class="rounded-lg!" type="info">
      <template #icon>
        <n-icon :size="14">
          <Envelope />
        </n-icon>
      </template>
    </n-button>
  </div>
</template>
