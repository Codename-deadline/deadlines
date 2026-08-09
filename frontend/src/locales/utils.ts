import { capitalize } from "vue";
import type { OrganizationRole } from "@/api/schemas/organization/common/OrganizationRole";
import { Language } from "@/types/Language";
import type { ScopeType } from "@/types/scope";

export const extractRoleFromString = (scope: ScopeType, roleString: OrganizationRole) => {
  const roleSplit: string[] = roleString.toLowerCase().split("_");
  if (roleSplit.length !== 2) return "scopes.common.unknown";
  return `scopes.${scope}.role.${roleSplit[1]}`;
};

export const tActionConfirmation = (t: any, action: string) => {
  return t(`actions.confirmation`, {
    action: t(`actions.to-confirm.${action}`),
  });
};

export const tEntityActionConfirmation = (t: any, scope: ScopeType, action: string) => {
  const entity: string = t(`scopes.${scope}.name`);
  const actionToConfirm: string = t(`actions.to-confirm.${action}-entity`, { entity });
  return t("actions.confirmation", {
    action: actionToConfirm,
  });
};

export const tEntityToastAction = (t: any, scope: ScopeType, action: string) => {
  return t(`scopes.toasts.entity-${action}`, {
    entity: t(`scopes.${scope}.name`),
  });
};

export const tFormLabel = (t: any, field: string) => {
  return t(`scopes.common.form-labels.${field}`);
};

export const tFormError = (t: any, field: string) => {
  return t(`scopes.common.form-errors.field-required`, {
    field: tFormLabel(t, field),
  });
};

export const tEntitiesNotFound = (t: any, entitySelector: string) =>
  capitalize(t("state.no-entities-found", { entity: t(entitySelector).toLowerCase() }));

export const tLanguageOptions = (t: any) =>
  // n-dropdown uses `key` as an option value
  // n-select uses `value` as an option value
  // => export both to make it compatible
  Object.values(Language).map((language) => ({
    label: t(`language.${language.toLowerCase()}`),
    key: language,
    value: language,
  }));
