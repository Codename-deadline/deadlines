<script setup lang="ts">
import { TrashAlt } from '@vicons/fa';
import { NButton, NPagination, NPopconfirm, NSkeleton } from 'naive-ui';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { AnyRole } from '@/api/common/AnyRole';
import type { MemberWithRole } from '@/api/schemas/common/Member';
import type { RolesMetadata } from '@/api/schemas/roles/metadata';
import RoleDropdown from '@/components/home/common/forms/RoleDropdown.vue';
import { PAGE_SIZE_KEY } from '@/constants/providerKeys';
import { ORG_OWNER_ROLE } from '@/constants/roles';
import { tActionConfirmation } from '@/locales/utils';
import { useMetadataStore } from '@/stores/MetadataStore';
import { useUserStore } from '@/stores/UserStore';
import type { ScopeType } from '@/types/scope';
import { injectOrThrow } from '@/utils';
import UserAvatar from '../../UserAvatar.vue';

const props = defineProps<{
  members: MemberWithRole[];
  totalPages: number;
  canManageRoles: boolean;
  isLoadingMembers: boolean;
  myRole?: AnyRole;
}>();
const emit = defineEmits<{
  loadMore: [page: number],
  updateRole: [member: MemberWithRole, newRole: AnyRole],
  removeMember: [member: MemberWithRole]
}>();
const { t } = useI18n();
const userStore = useUserStore();

const pageSize = injectOrThrow<number>(PAGE_SIZE_KEY);

// IMPORTANT: UI pages are 1-indexed, but api pages are 0-indexed
const currentPage = ref<number>(1);
watch(currentPage, (value) => {
  if (value > props.totalPages) return;
  // Members are loaded in batches, the page cannot be partially loaded
  // Therefore, if at least one member of the page is already loaded, we conclude that there are no more
  if (props.members.length > pageSize * (value - 1)) return;
  emit('loadMore', value - 1);
})

const membersToRender = computed<MemberWithRole[]>(
  () => props.members.slice((currentPage.value - 1) * pageSize, (currentPage.value) * pageSize)
);
const placeholdersToRender = computed<number>(() => pageSize - membersToRender.value.length);

const metadataStore = useMetadataStore();
const rolesMetadata: RolesMetadata | undefined = metadataStore.metadata.roles?.value;
if (!rolesMetadata) {
  throw new Error("MemberManager: Unable to retrieve roles metadata");
}

const userRoleIdx: number = rolesMetadata.roles.indexOf(props.myRole ?? "_INVALID_ROLE_");
const canUserAssignY = (roleX: AnyRole, _: ScopeType): boolean => {
  if (userRoleIdx < 0)
    return false;
  if (roleX === ORG_OWNER_ROLE)
    return false;
    
  const xIdx: number = rolesMetadata.roles.indexOf(roleX);
  // It is guaranteed that the matrix contains all roles and is quadratic NxN.
  return rolesMetadata.matrix[userRoleIdx]?.[xIdx] ?? false;
}
const isMe = (member: MemberWithRole) => member.user.id === userStore.user?.id;
const isOrganizationOwner = (member: MemberWithRole) => member.role === ORG_OWNER_ROLE;
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
                :disabled="!canManageRoles || isMe(member) || isOrganizationOwner(member)"
              />
              <n-popconfirm
                v-if="canManageRoles && !isOrganizationOwner(member)"
                @positive-click="() => emit('removeMember', member)"
                class="rounded-lg!"
              >
                <template #trigger>
                  <n-button v-show="!isMe(member)" class="rounded-lg!" size="small" type="error" ghost>
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
    <n-pagination class="mt-3" v-model:page="currentPage" :page-count="totalPages" />
  </div>
</template>
