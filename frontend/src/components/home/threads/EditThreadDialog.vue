<script setup lang="ts">
import { type FormInst, type FormRules, NButton, NForm, NFormItem, NInput, NPopconfirm, NTabPane, useMessage } from "naive-ui";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { type ThreadWithRoleModel, toThreadRole } from "@/api/adapters/thread";
import type { MemberModel } from "@/api/adapters/user";
import type { UserScopeResponseRole as AnyRole } from "@/api/generated/models";
import EntityDialoglayout from "@/components/home/common/dialogs/EntityDialoglayout.vue";
import MembersTab from "@/components/home/common/dialogs/members/MembersTab.vue";
import UserInvitationInput from "@/components/home/common/forms/UserInvitationInput.vue";
import QueryError from "@/components/home/common/QueryError.vue";
import { useEntityEdit } from "@/composables/shared/useEntityEdit";
import { useRequestError } from "@/composables/shared/useRequestError";
import { useThreadMutations } from "@/composables/threads/useThreadMutations";
import { useThread, useThreadAssignees } from "@/composables/threads/useThreads";
import { THREAD_ASSIGNEES_PAGE_SIZE } from "@/constants/defaults";
import { tEntityActionConfirmation, tEntityToastAction, tFormError } from "@/locales/utils";
import emitter from "@/plugins/emitter";
import { useCurrentScopeStore } from "@/stores/CurrentScopeStore";
import { normalizeUsername } from "@/utils/validation";

const props = defineProps<{ entity: ThreadWithRoleModel }>();
const { t } = useI18n();
const message = useMessage();
const router = useRouter();

const displayError = useRequestError();
const scope = useCurrentScopeStore();
const mutations = useThreadMutations(() => props.entity.organizationId);

const detail = useThread(() => props.entity.id);
const thread = computed(() => ({ ...props.entity, ...detail.thread.value }));

const patchFormRef = ref<FormInst | null>(null);
const invitationFormRef = ref<FormInst | null>(null);
const invitationFormModel = ref<{ username: string; role: AnyRole }>({ username: "", role: "THR_ASSIGNEE" });
const invitationFormRules: FormRules = {
  username: [{
    validator: (_, value: string) => Boolean(normalizeUsername(value.trim())),
    renderMessage: () => tFormError(t, "username"),
    trigger: ["input", "blur"]
  }],
};

const membersToLoad = THREAD_ASSIGNEES_PAGE_SIZE;
const memberPage = ref<number>(0);
const assignees = useThreadAssignees(() => props.entity.id, memberPage);
watch(() => props.entity.id, () => { memberPage.value = 0; });
watch(assignees.totalPages, (pages) => {
  if (pages > 0 && memberPage.value >= pages) memberPage.value = pages - 1;
});

const { patchFormModel, patchFormRules, handlePatch } = useEntityEdit({
  scopeType: "thread",
  formRef: patchFormRef,
  initialFormModel: {
    title: props.entity.title,
    description: props.entity.description ?? ""
  },
  isLoading: mutations.patch.isLoading,
  patch: (model) => mutations.patch.mutateAsync({
    threadId: props.entity.id,
    patchThreadRequest: model
  }),
});

const canManageMembers = computed(() => thread.value.permissions.manageAssignees);
const canInvite = canManageMembers;

const handleInvitationSubmission = () => {
  if (mutations.addAssignee.isLoading.value) return;

  invitationFormRef.value?.validate(async (errors) => {
    if (errors) return;
    try {
      await mutations.addAssignee.mutateAsync({
        threadId: props.entity.id,
        addThreadAssigneeRequest: {
          username: normalizeUsername(invitationFormModel.value.username.trim()),
          role: toThreadRole(invitationFormModel.value.role),
        }
      });

      invitationFormModel.value.username = "";
      message.success(t("scopes.toasts.member-invited"));
    } catch (error) {
      displayError(error);
    }
  });
};
const handleDelete = async () => {
  if (mutations.remove.isLoading.value) return;

  const wasCurrentScope: boolean = scope.threadId === props.entity.id;
  const path: string = router.currentRoute.value.fullPath;
  try {
    await mutations.remove.mutateAsync({ threadId: props.entity.id });
    emitter.emit("closeEditEntityDialog");
    message.success(tEntityToastAction(t, "thread", "deleted"));

    if (wasCurrentScope && router.currentRoute.value.fullPath === path) {
      await router.push({ path: "/threads", query: { orgId: props.entity.organizationId } });
    }
  } catch (error) {
    displayError(error);
  }
};
const handleRoleUpdate = async (member: MemberModel, role: AnyRole) => {
  if (member.role === role || mutations.role.isLoading.value) return;

  try {
    await mutations.role.mutateAsync({
      threadId: props.entity.id,
      changeRoleRequest: {
        subjectUsername: member.user.username,
        newRole: toThreadRole(role),
      }
    });

    message.success(t("scopes.toasts.role-assigned"));
  } catch (error) {
    displayError(error);
  }
};
const handleRemoveMember = async (member: MemberModel) => {
  if (mutations.removeAssignee.isLoading.value) return;
  try {
    await mutations.removeAssignee.mutateAsync({
      threadId: props.entity.id,
      assigneeUsername: member.user.username
    });
    message.success(t("scopes.toasts.member-removed"));
  } catch (error) {
    displayError(error);
  }
};
</script>

<template>
  <EntityDialoglayout
    scope-type="thread"
    :title="thread.title"
    :users-to-load="membersToLoad"
  >
    <n-tab-pane name="settings" :tab="t('scopes.common.form-sections.settings')">
      <QueryError :error="detail.error.value" :loading="detail.isLoading.value" @retry="detail.refetch()" />
      <n-form ref="patchFormRef" :model="patchFormModel" :rules="patchFormRules">
        <n-form-item :label="t('scopes.common.form-labels.title')" path="title">
          <n-input
            :disabled="!thread.permissions.update"
            class="rounded-lg!"
            v-model:value="patchFormModel.title"
          />
        </n-form-item>
        <n-form-item :label="t('scopes.common.form-labels.description')" path="description">
          <n-input
            :disabled="!thread.permissions.update"
            class="rounded-lg!"
            v-model:value="patchFormModel.description"
            type="textarea"
          />
        </n-form-item>
        <div class="
          grid grid-cols-3 px-4 mt-6
          landscape-mobile:mt-0
        ">
          <n-popconfirm
            :disabled="!thread.permissions.delete"
            @positive-click="handleDelete"
            class="rounded-lg!"
          >
            <template #trigger>
              <n-button
                role="button"
                :disabled="!thread.permissions.delete"
                :loading="mutations.remove.isLoading.value"
                class="rounded-lg!"
                type="error"
              >
                {{ t("actions.delete") }}
              </n-button>
            </template>
            {{ tEntityActionConfirmation(t, "thread", "delete") }}
          </n-popconfirm>
          <div></div>
          <n-button role="button" :disabled="!thread.permissions.update" :loading="mutations.patch.isLoading.value" @click="handlePatch" class="rounded-lg!" type="info">
            {{ t("actions.save") }}
          </n-button>
        </div>
      </n-form>
    </n-tab-pane>
    <n-tab-pane name="members" :tab="t('scopes.common.members')">
      <MembersTab
        @page-change="(page) => memberPage = page"
        @update-role="handleRoleUpdate"
        @remove-member="handleRemoveMember"
        @retry="assignees.refetch()"
        :members="assignees.members.value"
        :page="memberPage" :total-pages="assignees.totalPages.value"
        :loading="assignees.isLoading.value" :error="assignees.error.value"
        :is-saving="mutations.role.isLoading.value || mutations.removeAssignee.isLoading.value"
        :members-stats="thread.stats.assignees"
        :can-manage-roles="canManageMembers"
        :my-role="entity.globalRole ?? entity.role ?? undefined"
      />
    </n-tab-pane>
    <n-tab-pane
      v-if="canInvite"
      name="invites"
      :tab="t('scopes.common.form-sections.invitations')"
    >
      <n-form ref="invitationFormRef" :model="invitationFormModel" :rules="invitationFormRules">
        <n-form-item :label="t('scopes.common.form-labels.username')" path="username">
          <UserInvitationInput
            :show-invitation-button="true"
            :is-loading="mutations.addAssignee.isLoading.value"
            :organization-id="entity.organizationId"
            v-model:username="invitationFormModel.username"
            v-model:role="invitationFormModel.role"
            @click="handleInvitationSubmission"
          />
        </n-form-item>
      </n-form>
    </n-tab-pane>
  </EntityDialoglayout>
</template>
