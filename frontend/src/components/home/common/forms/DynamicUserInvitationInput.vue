<script setup lang="ts">
import { NDynamicInput } from 'naive-ui';
import type { AnyRole } from '@/api/common/AnyRole';
import { MAX_ORGANIZATION_CREATION_INVITATIONS } from '@/constants/forms';
import type { SafeApiCall } from '@/types/api';
import UserInvitationInput from './UserInvitationInput.vue';

const props = defineProps<{
  defaultRole: AnyRole;
  placeholder: string;
  usernamesFetcher: (startsWith: string) => Promise<SafeApiCall<string[]>>;
}>();

const emit = defineEmits<{
  click: [];
}>();
const model = defineModel<{ username: string; role: AnyRole }[]>({ required: true });


const onCreate = (): { username: string; role: AnyRole } => {
  return {
    username: "@",
    role: props.defaultRole,
  }
}
</script>

<template>
  <n-dynamic-input v-model:value="model" :on-create="onCreate" :max="MAX_ORGANIZATION_CREATION_INVITATIONS">
    <template #create-button-default>
      {{ placeholder }}
    </template>
    <template #default="{ value }">
      <UserInvitationInput
        v-model:username="value.username"
        v-model:role="value.role"
        :usernames-fetcher="usernamesFetcher"
        @click="emit('click')"
      />
    </template>
  </n-dynamic-input>
</template>
