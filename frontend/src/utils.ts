import type { NotificationApiInjection } from "naive-ui/es/notification/src/NotificationProvider";
import { capitalize, type InjectionKey, inject } from "vue";
import type { Router } from "vue-router";
import { GeneralErrorSchema } from "@/api/common/GeneralError";
import { ValidationErrorSchema } from "@/api/common/ValidationError";
import { DeadlineRoleSchema } from "./api/schemas/deadline/common/DeadlineRole";
import { OrganizationRoleSchema } from "./api/schemas/organization/common/OrganizationRole";
import { ThreadRoleSchema } from "./api/schemas/thread/common/ThreadRole";
import type { ApiError, AuthMethod, FieldError, FormErrors } from "./types/api";
import type { ScopeType } from "./types/scope";
import { formatValidationIssue } from "./utils/validation";

export const redirectToOTP = (router: Router, otpId: string, authMethod: AuthMethod) => {
  router.push({
    path: "/auth/otp",
    query: {
      id: otpId,
      method: authMethod,
    },
  });
};

export const isRoleInScope = (role: string, scopeType: ScopeType): boolean => {
  switch (scopeType) {
    case "organization":
      return OrganizationRoleSchema.safeParse(role).success;
    case "thread":
      return ThreadRoleSchema.safeParse(role).success;
    case "deadline":
      return DeadlineRoleSchema.safeParse(role).success;
  }
};

export const displayFormErrors = (t: any, notification: NotificationApiInjection, errors: FormErrors) => {
  const buildRow = (index: number, error: FieldError) => {
    const params = {
      field: capitalize(error.field),
      ...(error.params ?? {}),
    };
    return `${index}. ${t(`errors.form.${error.code.replace("_", "-")}`, params)}\n`;
  };

  let notificationBody: string = "";
  errors.forEach((error, index) => {
    notificationBody += buildRow(index + 1, error);
  });
  console.error(errors);

  notification.error({
    title: t("errors.form.invalid-input"),
    content: notificationBody,
    duration: 5000,
  });
};

export const displayApiError = (tSafe: any, notification: NotificationApiInjection, error: ApiError) => {
  const apiError = error.error;

  let errorMessageContent: string | null = null;
  let errorMessageTitle = tSafe("errors.error");

  switch (apiError.name) {
    case "HttpError": {
      const validationError = ValidationErrorSchema.safeParse(apiError.body);
      if (validationError.success) {
        console.error(validationError.data);
        errorMessageTitle = tSafe("errors.validation.title");
        errorMessageContent = validationError.data.violations
          .map((issue, index) => `${index + 1}. ${formatValidationIssue(tSafe, issue)}`)
          .join("\n");
        break;
      }

      const parsed = GeneralErrorSchema.safeParse(apiError.body);
      if (!parsed.success) {
        console.error("Failed to display error data");
        break;
      }
      console.error(parsed.data);
      errorMessageContent = tSafe(`errors.api.${parsed.data.code}`, parsed.data.params ?? {});
      break;
    }
    case "NetworkError": {
      errorMessageContent = tSafe("errors.api.no-network");
      break;
    }
    case "TimeoutError": {
      errorMessageContent = tSafe("errors.api.timeout");
      break;
    }
    case "ValidationError": {
      console.error("Failed to parse response body");
      break;
    }
  }

  notification.error({
    title: errorMessageTitle,
    content: errorMessageContent ?? tSafe("errors.unknown-error"),
    duration: 3500,
  });
};

export const injectOrThrow = <T>(key: InjectionKey<T>): T => {
  const value = inject(key);
  if (!value) {
    throw new Error(`injectOrThrow: Unable to inject value for key ${String(key)}`);
  }
  return value;
};

/**
 * Deduplicates a list of invitations.
 * Removes all '@' from the usernames in the process.
 *
 * @param invitations - an array of invitations with possible duplicates
 * @returns an array of invitations with no duplicates
 */
export const deduplicateInvitationsByUsername = <T extends { username: string; role: string }>(invitations: T[]) => {
  // Deduplicate invitations by username
  const normalizedInvitations = invitations.map((invitation) => {
    return { ...invitation, username: invitation.username.trim().replace("@", "") };
  });

  const uniqueUsernames: Set<string> = new Set();
  const uniqueInvitations: T[] = [];
  for (const invitation of normalizedInvitations) {
    if (!uniqueUsernames.has(invitation.username)) {
      uniqueUsernames.add(invitation.username);
      uniqueInvitations.push(invitation);
    }
  }

  return uniqueInvitations;
};
