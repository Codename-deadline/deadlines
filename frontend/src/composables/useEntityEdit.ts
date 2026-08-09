import { useWindowSize } from "@vueuse/core";
import { type FormInst, type FormRules, useMessage } from "naive-ui";
import { computed, type Ref, ref } from "vue";
import { useI18n } from "vue-i18n";
import type { AnyRole } from "@/api/common/AnyRole";
import type { PagedResponse } from "@/api/common/PaginationResponse";
import type { MemberWithRole } from "@/api/schemas/common/Member";
import { useApi } from "@/composables/useApi";
import { DEFAULT_MEMBERS_PAGE_SIZE } from "@/constants/defaults";
import { tEntityToastAction, tFormError } from "@/locales/utils";
import emitter from "@/plugins/emitter";
import type { ListType } from "@/stores/InfiniteListStore";
import { useInfiniteListStore } from "@/stores/InfiniteListStore";
import type { SafeApiCall } from "@/types/api";
import type { ScopeType, UserScopedRoles } from "@/types/scope";

export function useEntityEdit<TFormModel extends { title: string; description?: string }>(config: {
  scopeType: ScopeType;
  listType: ListType;
  entity: {
    id: number;
    title: string;
    description?: string;
    permissions: Record<string, boolean>;
    stats: Record<string, number>;
    role: AnyRole | null;
    globalRole?: AnyRole | null;
  };
  patchFormRef: Ref<FormInst | null>;
  invitationFormRef: Ref<FormInst | null>;
  managePermissionKey: string;
  invitePermissionKey: string;
  memberStatKey: string;
  defaultInvitationRole: AnyRole;
  initialFormModel: TFormModel;
  extraFormRules?: FormRules;
  transformPatchData?: (data: TFormModel) => Record<string, unknown>;
  syncFields?: (keyof TFormModel)[];
  apiCalls: {
    patch: (id: number, data: { title: string; description?: string }) => Promise<SafeApiCall<unknown>>;
    delete: (id: number) => Promise<SafeApiCall<unknown>>;
    invite: (id: number, data: { username: string; role: AnyRole }) => Promise<SafeApiCall<unknown>>;
    fetchMembers: (
      id: number,
      page: number,
      size: number,
    ) => Promise<SafeApiCall<PagedResponse<MemberWithRole> | MemberWithRole[]>>;
    changeRole: (id: number, request: { subjectUsername: string; newRole: AnyRole }) => Promise<SafeApiCall<unknown>>;
    removeMember: (id: number, username: string) => Promise<SafeApiCall<unknown>>;
  };
}) {
  const { t } = useI18n();
  const { makeRequest } = useApi();
  const message = useMessage();
  const { height } = useWindowSize();

  const membersToLoad = height.value >= 550 ? DEFAULT_MEMBERS_PAGE_SIZE : 2;

  const patchFormModel = ref<TFormModel>(config.initialFormModel);
  const defaultFormRules: FormRules = {
    title: [{ required: true, renderMessage: () => tFormError(t, "title"), trigger: ["input", "blur"] }],
  };
  const patchFormRules: FormRules = {
    ...defaultFormRules,
    ...config.extraFormRules,
  };

  const handlePatch = async (e: MouseEvent) => {
    e.preventDefault();
    config.patchFormRef.value?.validate(async (errors) => {
      if (errors) return;
      const patchData = config.transformPatchData
        ? config.transformPatchData(patchFormModel.value)
        : (patchFormModel.value as unknown as Record<string, unknown>);
      const res = await makeRequest(() =>
        config.apiCalls.patch(config.entity.id, patchData as Parameters<typeof config.apiCalls.patch>[1]),
      );
      if (!res.ok) return;

      config.entity.title = patchFormModel.value.title;
      config.entity.description = patchFormModel.value.description;
      if (config.syncFields) {
        for (const field of config.syncFields) {
          (config.entity as Record<string, unknown>)[field as string] = patchFormModel.value[field];
        }
      }
      message.success(tEntityToastAction(t, config.scopeType, "updated"));
    });
  };

  const invitationFormModel = ref<{ username: string; role: AnyRole }>({
    username: "",
    role: config.defaultInvitationRole,
  });
  const invitationFormRules: FormRules = {
    username: [{ required: true, renderMessage: () => tFormError(t, "username"), trigger: ["input", "blur"] }],
  };

  const handleInvitationSubmission = async () => {
    config.invitationFormRef.value?.validate(async (errors) => {
      if (errors) return;
      const res = await makeRequest(() =>
        config.apiCalls.invite(config.entity.id, {
          username: invitationFormModel.value.username.trim().replace("@", ""),
          role: invitationFormModel.value.role,
        }),
      );
      if (!res.ok) return;

      message.success(t("scopes.toasts.member-invited"));
      invitationFormModel.value.username = "";
    });
  };

  const handleDelete = async (e: MouseEvent) => {
    e.preventDefault();
    const res = await makeRequest(() => config.apiCalls.delete(config.entity.id));
    if (!res.ok) return;

    const infiniteListStore = useInfiniteListStore();
    infiniteListStore.removeItem(config.listType, config.entity.id);

    emitter.emit("closeEditEntityDialog");
    message.success(tEntityToastAction(t, config.scopeType, "deleted"));
  };

  const handleFetchMembers = (page: number) => config.apiCalls.fetchMembers(config.entity.id, page, membersToLoad);

  const handleRoleUpdate = (request: { subjectUsername: string; newRole: AnyRole }) =>
    config.apiCalls.changeRole(config.entity.id, request);

  const handleRemoveMember = async (username: string) => {
    config.entity.stats[config.memberStatKey]--;
    return config.apiCalls.removeMember(config.entity.id, username);
  };

  const canManageMembers = computed(() => config.entity.permissions[config.managePermissionKey] ?? false);
  const canInvite = computed(() => config.entity.permissions[config.invitePermissionKey] ?? false);

  const myRoles = computed<UserScopedRoles<AnyRole>>(() => {
    return { scope: config.entity.role, global: config.entity.globalRole ?? config.entity.role ?? undefined };
  });

  return {
    patchFormModel,
    patchFormRules,
    handlePatch,
    handleDelete,
    invitationFormModel,
    invitationFormRules,
    handleInvitationSubmission,
    handleFetchMembers,
    handleRoleUpdate,
    handleRemoveMember,
    canManageMembers,
    canInvite,
    myRoles,
    membersToLoad,
  };
}
