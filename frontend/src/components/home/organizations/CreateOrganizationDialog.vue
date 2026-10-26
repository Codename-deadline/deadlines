<script setup lang="ts">
import { ArrowLeft, ArrowRight } from "@vicons/fa";
import { type FormInst, NButton, NForm, NFormItem, NIcon, NInput, NSelect } from "naive-ui";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { toCreateOrganizationRequest } from "@/api/adapters/organization";
import { OrganizationResponseType } from "@/api/generated/models";
import EntityCreationDialogLayout from "@/components/home/common/dialogs/EntityCreationDialogLayout.vue";
import DynamicUserInvitationInput from "@/components/home/common/forms/DynamicUserInvitationInput.vue";
import Step from "@/components/home/common/stepper/Step.vue";
import { useEntityCreate } from "@/composables/useEntityCreate";
import { useOrganizationMutations } from "@/composables/useOrganizationMutations";
import { tFormError } from "@/locales/utils";

type OrgFormModel = { title: string; description: string; visibility: OrganizationResponseType };
const { t } = useI18n();
const formRef = ref<FormInst | null>(null);
const organizationVisibilityOptions = Object.values(OrganizationResponseType).map((type) => ({
  value: type, label: t(`scopes.organization.type.${type.toLowerCase()}`),
}));
const defaultInvitationRole = "ORG_MEMBER";
const { create } = useOrganizationMutations();
const { formModel, formRules, invitationFormModel, validateFormData, handleCreation } = useEntityCreate<OrgFormModel>({
  scopeType: "organization",
  formRef,
  initialFormModel: {
    title: "",
    description: "",
    visibility: "PRIVATE"
  },
  extraFormRules: {
    visibility: [{ required: true, renderMessage: () => tFormError(t, "visibility"), trigger: ["change"] }]
  },
  isLoading: create.isLoading,
  create: (form, invitations) => create.mutateAsync({
    createOrganizationRequest: toCreateOrganizationRequest({
      title: form.title,
      description: form.description,
      type: form.visibility,
      invitations,
    })
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
          <DynamicUserInvitationInput
            v-model="invitationFormModel"
            :default-role="defaultInvitationRole"
            :placeholder="t('scopes.organization.no-invitations')"
          />
        </n-form-item>
      </n-form>
      <div class="flex flex-1 justify-between">
        <n-button role="button" @click="prevStep">
          <n-icon>
            <ArrowLeft />
          </n-icon>
        </n-button>
        <n-button
          role="button"
          type="info"
          @click="handleCreation"
          :loading="create.isLoading.value"
          :disabled="create.isLoading.value"
        >
          {{ t("actions.create") }}
        </n-button>
      </div>
    </Step>
  </EntityCreationDialogLayout>
</template>
