<script setup lang="ts">
import { TrashAlt } from '@vicons/fa';
import { NButton, NPagination, NPopconfirm, NSkeleton } from 'naive-ui';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { MemberModel } from '@/api/adapters/user';
import type { AnyRole } from '@/api/common/AnyRole';
import RoleDropdown from '@/components/home/common/forms/RoleDropdown.vue';
import { useCurrentUser } from '@/composables/useCurrentUser';
import { PAGE_SIZE_KEY } from '@/constants/providerKeys';
import { ORG_OWNER_ROLE } from '@/constants/roles';
import { tActionConfirmation } from '@/locales/utils';
import { useMetadataStore } from '@/stores/MetadataStore';
import type { ScopeType } from '@/types/scope';
import { injectOrThrow } from '@/utils';
import UserAvatar from '../../UserAvatar.vue';

const props = defineProps<{
  members: MemberModel[];
  page: number;
  totalPages: number;
  isSaving?: boolean;
  canManageRoles: boolean;
  isLoadingMembers: boolean;
  myRole?: AnyRole;
}>();
const emit = defineEmits<{
  pageChange: [page: number],
  updateRole: [member: MemberModel, newRole: AnyRole],
  removeMember: [member: MemberModel]
}>();
const { t } = useI18n();
const { user } = useCurrentUser();

const pageSize = injectOrThrow<number>(PAGE_SIZE_KEY);

const membersToRender = computed(() => props.members);
const placeholdersToRender = computed<number>(() => pageSize - membersToRender.value.length);

const metadataStore = useMetadataStore();
const rolesMetadata = computed(() => metadataStore.metadata.roles?.value);

const canUserAssignY = (role: AnyRole, _: ScopeType): boolean => {
  if (props.isSaving || role === ORG_OWNER_ROLE)
    return false;

  const metadata = rolesMetadata.value;
  if (!metadata)
    return false;

  const userRoleIdx = metadata.roles.indexOf(props.myRole ?? "");
  const roleIdx = metadata.roles.indexOf(role);
  return metadata.matrix[userRoleIdx]?.[roleIdx] ?? false;
};
const isMe = (member: MemberModel) => member.user.id === user.value?.id;
const isOrganizationOwner = (member: MemberModel) => member.role === ORG_OWNER_ROLE;
</script>

<template>
  <section class="mt-2 min-w-75!">
    <Transition
      mode="out-in"
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="isLoadingMembers" key="skeleton" class="space-y-2">
        <n-skeleton v-for="i in placeholdersToRender" :key="i" class="h-[60.4px]!" :sharp="false" />
      </div>
      <div v-else-if="members.length > 0" key="members" class="space-y-2">
        <div
          v-for="member in membersToRender" :key="member.user.id"
          class="flex border border-border-default rounded-lg p-2 space-x-4"
        >
          <user-avatar :user="member.user"/>
          <div class="flex flex-1 justify-end items-center">
            <div class="flex items-center space-x-2!">
              <RoleDropdown
                @select="(role) => emit('updateRole', member, role)"
                :button-role="member.role"
                :filter="canUserAssignY"
                :disabled="isSaving || !canManageRoles || isMe(member) || isOrganizationOwner(member)"
              />
              <n-popconfirm
                v-if="canManageRoles && !isOrganizationOwner(member)"
                @positive-click="() => emit('removeMember', member)"
                class="rounded-lg!"
              >
                <template #trigger>
                  <n-button
                    v-show="!isMe(member)"
                    :disabled="isSaving"
                    class="rounded-lg!"
                    size="small"
                    type="error"
                    ghost
                  >
                    <template #icon>
                      <Icon :size="16">
                        <TrashAlt />
                      </Icon>
                    </template>
                  </n-button>
                </template>
                {{ tActionConfirmation(t, 'remove-member') }}
              </n-popconfirm>
            </div>
          </div>
        </div>
        <!-- Keep the element height constant regardless of the number of members rendered -->
        <div v-for="i in (pageSize - membersToRender.length)" :key="i + pageSize" class="h-[60.4px]!"></div>
      </div>
      <div v-else key="empty" class="flex justify-center items-center p-5">
        {{ t("scopes.common.nothing-here") }}
      </div>
    </Transition>
  </section>
  <div class="flex justify-center">
    <n-pagination
      :disabled="isLoadingMembers || isSaving"
      @update:page="(value) => emit('pageChange', value - 1)"
      :page-count="totalPages"
      :page="page + 1"
      class="mt-3"
    />
  </div>
</template>
