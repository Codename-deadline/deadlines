<script setup lang="ts">
import { useMessage } from 'naive-ui';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { AnyRole } from '@/api/common/AnyRole';
import type { PagedResponse } from '@/api/common/PaginationResponse';
import type { MemberWithRole } from '@/api/schemas/common/Member';
import { useApi } from '@/composables/useApi';
import { useLoading } from '@/composables/useLoading';
import type { SafeApiCall } from '@/types/api';
import MemberManager from './MemberManager.vue';

const props = defineProps<{
  fetcher: (page: number) => Promise<SafeApiCall<PagedResponse<MemberWithRole> | MemberWithRole[]>>;
  updateMemberRole: (request: { subjectUsername: string; newRole: AnyRole }) => Promise<SafeApiCall<unknown>>;
  removeMember: (username: string) => Promise<SafeApiCall<unknown>>;
  membersStats: number;
  canManageRoles: boolean;
  myRole?: AnyRole;
}>();

const members = ref<MemberWithRole[]>([]);
const totalPages = ref<number>(1);

const { makeRequest } = useApi();

const { isLoading: isLoadingMembers, withLoading } = useLoading();
const loadMembers = async (page: number) => {
  const res = await withLoading(() => makeRequest(() => props.fetcher(page)));
  if (!res.ok) return;

  if (Array.isArray(res.data)) {
    // One time load of all members
    members.value = res.data;
    totalPages.value = 1;
  } else {
    // Page load
    members.value = members.value.concat(res.data.data);
    totalPages.value = res.data.totalPages;
  }
};

const message = useMessage();
const { t } = useI18n();
const handleRoleUpdate = async (member: MemberWithRole, newRole: AnyRole) => {
  if (newRole === member.role) return;
  const res = await makeRequest(() => props.updateMemberRole({ subjectUsername: member.user.username, newRole }));

  if (!res.ok) return;

  member.role = newRole;
  message.success(t("scopes.toasts.role-assigned"));
};

const handleRemoveMember = async (member: MemberWithRole) => {
  const res = await makeRequest(() => props.removeMember(member.user.username));
  if (!res.ok) return;

  members.value = members.value.filter(m => m.user.username !== member.user.username);
  // TODO: Decrement total pages if members.value.length % pageSize === 0
  message.success(t("scopes.toasts.member-removed"));
};

onMounted(async () => {
  await loadMembers(0);
})
</script>

<template>
  <div>
    <div>{{ t("scopes.common.members") }} ({{ membersStats }})</div>
    <member-manager
      @loadMore="loadMembers"
      @updateRole="handleRoleUpdate"
      @removeMember="handleRemoveMember"
      :members="members"
      :is-loading-members="isLoadingMembers"
      :total-pages="totalPages"
      :can-manage-roles="canManageRoles"
      :my-role="myRole"
    />
  </div>
</template>
