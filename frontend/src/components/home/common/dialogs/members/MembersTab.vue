<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { MemberModel } from "@/api/adapters/user";
import type { AnyRole } from "@/api/common/AnyRole";
import QueryError from "../../QueryError.vue";
import MemberManager from "./MemberManager.vue";

const props = defineProps<{
  members: MemberModel[];
  page: number;
  totalPages: number;
  loading: boolean;
  error: unknown;
  isSaving?: boolean;
  membersStats: number;
  canManageRoles: boolean;
  myRole?: AnyRole;
}>();
const emit = defineEmits<{
  pageChange: [page: number];
  updateRole: [member: MemberModel, role: AnyRole];
  removeMember: [member: MemberModel];
  retry: [];
}>();
const { t } = useI18n();
</script>

<template>
  <div>
    <div>{{ t('scopes.common.members') }} ({{ membersStats }})</div>
    <QueryError :error="error" :loading="loading" @retry="emit('retry')" />
    <MemberManager
      :members="members"
      :page="page"
      :total-pages="totalPages"
      :is-loading-members="loading && members.length === 0"
      :is-saving="isSaving"
      :can-manage-roles="canManageRoles" :my-role="myRole"
      @page-change="(value) => emit('pageChange', value)"
      @update-role="(member, role) => emit('updateRole', member, role)"
      @remove-member="(member) => emit('removeMember', member)"
    />
  </div>
</template>
