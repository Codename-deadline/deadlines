<script setup lang="ts">
import { ArrowLeft, ArrowRight } from "@vicons/fa";
import { type FormInst, NButton, NForm, NFormItem, NIcon, NInput, NSelect } from "naive-ui";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { createOrganization } from "@/api/organization";
import type { OrganizationWithStatsAndRole } from "@/api/schemas/organization/common/Organization";
import type { OrganizationRole } from "@/api/schemas/organization/common/OrganizationRole";
import type { OrganizationType } from "@/api/schemas/organization/common/OrganizationType";
import type { CreateOrganizationResponse } from "@/api/schemas/organization/create/CreateOrganizationResponse";
import { getUsersWithUsernameStartingWith } from "@/api/user";
import EntityCreationDialogLayout from "@/components/home/common/dialogs/EntityCreationDialogLayout.vue";
import DynamicUserInvitationInput from "@/components/home/common/forms/DynamicUserInvitationInput.vue";
import Step from "@/components/home/common/stepper/Step.vue";
import { useEntityCreate } from "@/composables/useEntityCreate";
import { ORG_OWNER_ROLE } from "@/constants/roles";
import { tFormError } from "@/locales/utils";

type OrgFormModel = {
  title: string;
  description: string;
  visibility: OrganizationType;
}

const { t } = useI18n();

const formRef = ref<FormInst | null>(null);
const invitationFormRef = ref<FormInst | null>(null);

const organizationVisibilityOptions: { value: OrganizationType; label: string }[] = [
  "PRIVATE",
  "PUBLIC",
  "PERSONAL",
].map((type) => ({
  value: type as OrganizationType,
  label: t(`scopes.organization.type.${type.toLowerCase()}`),
}));

const defaultInvitationRole: OrganizationRole = "ORG_MEMBER"
const { formModel, formRules, invitationFormModel, validateFormData, handleCreation } = useEntityCreate<
  OrgFormModel,
  OrganizationWithStatsAndRole,
  CreateOrganizationResponse
>({
  scopeType: "organization",
  listType: "organizations",
  defaultInvitationRole,
  invitationPlaceholder: t("scopes.organization.no-invitations"),
  formRef,
  invitationFormRef,
  initialFormModel: { title: "", description: "", visibility: "PRIVATE" },
  extraFormRules: {
    visibility: [
      { required: true, renderMessage: () => tFormError(t, "visibility"), trigger: ["input", "blur"] },
    ],
  },
  createApiCall: async (formData, invitations) =>
    createOrganization({
      title: formData.title,
      description: formData.description,
      type: formData.visibility,
      invitations,
    }),
  buildEntity: (response, formData) => ({
    id: response.organizationId,
    title: formData.title,
    description: formData.description,
    type: formData.visibility,
    createdAt: Date.now(),
    stats: { members: 1, threads: 0 },
    permissions: {
      update: true,
      delete: true,
      manageRoles: true,
      invite: true,
      createThreads: true,
    },
    role: ORG_OWNER_ROLE,
  }),
});
</script>

<template>
  <EntityCreationDialogLayout scope-type="organization">
    <Step :title="t('scopes.common.form-sections.details')" :value="1" v-slot="{ nextStep }">
      <n-form ref="formRef" :model="formModel" :rules="formRules">
        <div class="landscape-mobile:flex landscape-mobile:gap-4 landscape-mobile:min-w-[50vw]">
          <div class="flex-2">
            <n-form-item :label="t('scopes.common.form-labels.title')" path="title">
              <n-input v-model:value="formModel.title" />
            </n-form-item>
            <n-form-item :label="t('scopes.common.form-labels.description')" path="description">
              <n-input v-model:value="formModel.description" type="textarea" />
            </n-form-item>
          </div>
          <div class="flex-1">
            <n-form-item :label="t('scopes.common.form-labels.visibility')" path="visibility">
              <n-select v-model:value="formModel.visibility" :options="organizationVisibilityOptions" />
            </n-form-item>
          </div>
        </div>
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
          <!-- TODO: Remove hardcoded ORG_MEMBER -->
          <DynamicUserInvitationInput
            v-model="invitationFormModel"
            :default-role="defaultInvitationRole"
            :placeholder="t('scopes.organization.no-invitations')"
            :usernames-fetcher="getUsersWithUsernameStartingWith"
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
