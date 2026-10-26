import { type FormInst, type FormRules, useMessage } from "naive-ui";
import { type MaybeRefOrGetter, type Ref, ref, toValue } from "vue";
import { useI18n } from "vue-i18n";
import { tEntityToastAction, tFormError } from "@/locales/utils";
import emitter from "@/plugins/emitter";
import type { ScopeType } from "@/types/scope";
import { useRequestError } from "./useRequestError";

export function useEntityCreate<T extends object>(config: {
  scopeType: ScopeType;
  formRef: Ref<FormInst | null>;
  initialFormModel: T;
  extraFormRules?: FormRules;
  isLoading: MaybeRefOrGetter<boolean>;
  create: (model: T, invitations: { username: string; role: string }[]) => Promise<unknown>;
}) {
  const { t } = useI18n();
  const message = useMessage();
  const displayError = useRequestError();

  const formModel = ref(config.initialFormModel);
  const invitationFormModel = ref<{ username: string; role: string }[]>([]);
  const formRules: FormRules = {
    title: [{ required: true, renderMessage: () => tFormError(t, "title"), trigger: ["input", "blur"] }],
    ...config.extraFormRules,
  };

  const validateFormData = (next: () => void) =>
    config.formRef.value?.validate((errors) => {
      if (!errors) next();
    });

  const handleCreation = async () => {
    if (toValue(config.isLoading)) return;

    try {
      await config.create(formModel.value as T, invitationFormModel.value);
      message.success(tEntityToastAction(t, config.scopeType, "created"));
      emitter.emit("closeCreateEntityDialog");
    } catch (error) {
      displayError(error);
    }
  };

  return { formModel, invitationFormModel, formRules, validateFormData, handleCreation };
}
