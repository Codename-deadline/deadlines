<script setup lang="ts">
import { NAvatar } from 'naive-ui';
import type { MinimalUser } from '@/api/schemas/user/common/User';
import { getAvatarText } from '@/utils/strings';

withDefaults(
  defineProps<{
    user: MinimalUser,
    showUsername?: boolean
  }>(),
  {
    showUsername: true
  }
)
</script>

<template>
  <div class="flex items-center">
    <n-avatar round class="mr-2">{{ getAvatarText(user.fullName) }}</n-avatar>
    <div :class="{'flex flex-col': showUsername}">
      <span>{{ user.fullName }}</span>
      <span v-if="showUsername" class="text-sm description">@{{ user.username }}</span>
    </div>
  </div>
</template>
