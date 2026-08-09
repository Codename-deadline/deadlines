import { type FormInst, type FormRules, useMessage } from "naive-ui";
import { type Ref, ref } from "vue";
import { useI18n } from "vue-i18n";
import type { AnyRole } from "@/api/common/AnyRole";
import { useApi } from "@/composables/useApi";
import { tEntityToastAction, tFormError } from "@/locales/utils";
import emitter from "@/plugins/emitter";
import type { ListType } from "@/stores/InfiniteListStore";
import { useInfiniteListStore } from "@/stores/InfiniteListStore";
import type { SafeApiCall } from "@/types/api";
import type { ScopeType } from "@/types/scope";
import { deduplicateInvitationsByUsername } from "@/utils";

type InvitationEntry = { username: string; role: AnyRole };

export function useEntityCreate<TFormModel extends object, TEntity extends { id: number }, TResponse>(config: {
  scopeType: ScopeType;
  listType: ListType;
  defaultInvitationRole: AnyRole;
  invitationPlaceholder: string;
  formRef: Ref<FormInst | null>;
  invitationFormRef: Ref<FormInst | null>;
  createApiCall: (formData: TFormModel, invitations: InvitationEntry[]) => Promise<SafeApiCall<TResponse>>;
  buildEntity: (response: TResponse, formData: TFormModel) => TEntity;
  initialFormModel: TFormModel;
  extraFormRules?: FormRules;
}) {
  const { t } = useI18n();
  const { makeRequest } = useApi();
  const message = useMessage();
  const { addOne } = useInfiniteListStore();

  const formModel = ref<TFormModel>(config.initialFormModel);

  const defaultFormRules: FormRules = {
    title: [{ required: true, renderMessage: () => tFormError(t, "title"), trigger: ["input", "blur"] }],
  };
  const formRules: FormRules = { ...defaultFormRules, ...config.extraFormRules };

  const invitationFormModel = ref<InvitationEntry[]>([]);

  const validateFormData = (nextStep: () => void) => {
    config.formRef.value?.validate((errors) => {
      if (errors) {
        console.error(errors);
        return;
      }
      nextStep();
    });
  };

  const handleCreation = async () => {
    const uniqueInvitations = deduplicateInvitationsByUsername(invitationFormModel.value);
    const res = await makeRequest(() => config.createApiCall(formModel.value, uniqueInvitations));
    if (!res.ok) return;

    message.success(tEntityToastAction(t, config.scopeType, "created"));
    emitter.emit("closeCreateEntityDialog");
    addOne<TEntity>(config.listType, config.buildEntity(res.data, formModel.value));
  };

  return {
    formModel,
    formRules,
    invitationFormModel,
    validateFormData,
    handleCreation,
  };
}
