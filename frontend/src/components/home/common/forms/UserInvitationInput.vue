<script setup lang="ts">
import { Envelope } from '@vicons/fa';
import { NButton, NIcon } from 'naive-ui';
import type { AnyRole } from '@/api/common/AnyRole';
import type { SafeApiCall } from '@/types/api';
import RoleDropdown from './RoleDropdown.vue';
import UsernameInput from './UsernameInput.vue';

const props = withDefaults(
  defineProps<{
    usernamesFetcher: (startsWith: string) => Promise<SafeApiCall<string[]>>
    showInvitationButton?: boolean;
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
    <username-input v-model="modelUsername" :usernames-fetcher="usernamesFetcher" />
    <RoleDropdown
      @select="(role: AnyRole) => modelRole = role"
      :button-role="modelRole"
      :filter="(role: AnyRole) => !role.endsWith('OWNER')"
      size="medium"
    />
    <n-button role="button" v-if="showInvitationButton" @click="handleClick" class="rounded-lg!" type="info">
      <template #icon>
        <n-icon :size="14">
          <Envelope />
        </n-icon>
      </template>
    </n-button>
  </div>
</template>
