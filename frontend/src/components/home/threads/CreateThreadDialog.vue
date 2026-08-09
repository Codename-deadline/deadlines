<script setup lang="ts">
import { ArrowLeft, ArrowRight } from "@vicons/fa";
import { type FormInst, NButton, NForm, NFormItem, NIcon, NInput } from "naive-ui";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { getOrganizationMembersWithUsernameStartingWith } from "@/api/organization";
import type { ThreadWithRole } from "@/api/schemas/thread/common/Thread";
import type { ThreadRole } from "@/api/schemas/thread/common/ThreadRole";
import type { CreateThreadResponse } from "@/api/schemas/thread/create/CreateThreadResponse";
import { createThread } from "@/api/thread";
import EntityCreationDialogLayout from "@/components/home/common/dialogs/EntityCreationDialogLayout.vue";
import DynamicUserInvitationInput from "@/components/home/common/forms/DynamicUserInvitationInput.vue";
import Step from "@/components/home/common/stepper/Step.vue";
import { useEntityCreate } from "@/composables/useEntityCreate";
import emitter from "@/plugins/emitter";
import { useCurrentScopeStore } from "@/stores/CurrentScopeStore";
import { parsePositiveRouteId } from "@/utils/route";

const route = useRoute();

const currentScopeStore = useCurrentScopeStore();
const organizationId = currentScopeStore.organization?.id ?? parsePositiveRouteId(route.query.orgId) ?? 0;
if (!organizationId) {
  emitter.emit("closeCreateEntityDialog");
}

const { t } = useI18n();

type ThreadFormModel = {
  title: string;
  description: string;
}

const formRef = ref<FormInst | null>(null);
const invitationFormRef = ref<FormInst | null>(null);

const defaultInvitationRole: ThreadRole = "THR_ASSIGNEE"
const { formModel, formRules, invitationFormModel, validateFormData, handleCreation } = useEntityCreate<
  ThreadFormModel,
  ThreadWithRole,
  CreateThreadResponse
>({
  scopeType: "thread",
  listType: "threads",
  defaultInvitationRole,
  invitationPlaceholder: t("scopes.thread.no-assignees"),
  formRef,
  invitationFormRef,
  initialFormModel: { title: "", description: "" },
  createApiCall: async (formData, invitations) =>
    createThread(organizationId, {
      title: formData.title,
      description: formData.description,
      invitations: invitations,
    }),
  buildEntity: (response, formData) => ({
    id: response.threadId,
    title: formData.title,
    description: formData.description,
    organizationId: organizationId,
    createdAt: Date.now(),
    stats: {
      assignees: response.assignees,
      deadlines: 0,
      completedDeadlines: 0,
    },
    permissions: {
      createDeadlines: true,
      delete: true,
      manageAssignees: true,
      update: true,
    },
    role: "THR_OWNER",
    globalRole: response.globalRole
  }),
});
</script>

<template>
  <EntityCreationDialogLayout scope-type="thread">
    <Step :title="t('scopes.common.form-sections.details')" :value="1" v-slot="{ nextStep }">
      <n-form ref="formRef" :model="formModel" :rules="formRules">
        <n-form-item :label="t('scopes.common.form-labels.title')" path="title">
          <n-input v-model:value="formModel.title" />
        </n-form-item>
        <n-form-item :label="t('scopes.common.form-labels.description')" path="description">
          <n-input v-model:value="formModel.description" type="textarea" />
        </n-form-item>
      </n-form>
      <div class="flex flex-1 justify-end">
        <n-button role="button" @click="() => validateFormData(nextStep!)">
          <template #icon>
            <n-icon>
              <ArrowRight />
            </n-icon>
          </template>
        </n-button>
      </div>
    </Step>
    <Step :title="t('scopes.common.form-sections.invitations')" :value="2" v-slot="{ prevStep }">
      <n-form ref="invitationFormRef" :model="invitationFormModel">
        <n-form-item :label="t('scopes.common.form-labels.invitations')" path="username">
          <DynamicUserInvitationInput
            v-model="invitationFormModel"
            :default-role="defaultInvitationRole"
            :placeholder="t('scopes.thread.no-assignees')"
            :usernames-fetcher="(usernamePrefix) => getOrganizationMembersWithUsernameStartingWith(organizationId, usernamePrefix)"
          />
        </n-form-item>
      </n-form>
      <div class="flex flex-1 justify-between">
        <n-button role="button" @click="prevStep">
          <n-icon>
            <ArrowLeft />
          </n-icon>
        </n-button>
        <n-button role="button" @click="handleCreation" type="info">
          {{ t("actions.create") }}
        </n-button>
      </div>
    </Step>
  </EntityCreationDialogLayout>
</template>
