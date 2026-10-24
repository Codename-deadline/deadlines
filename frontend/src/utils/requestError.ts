import { ApiRequestError, isCancellation } from "@/api/errors";
import { formatValidationIssue, type ValidationMessage, type ValidationTranslator } from "./validation";

type ErrorBody = { code?: string; params?: Record<string, unknown>; violations?: ValidationMessage[] };

export function requestErrorNotification(error: unknown, t: ValidationTranslator) {
  if (isCancellation(error)) return;

  let title = t("errors.error");
  let content: string | undefined;

  if (error instanceof ApiRequestError) {
    switch (error.name) {
      case "HttpError": {
        const body = error.body && typeof error.body === "object" ? (error.body as ErrorBody) : undefined;
        if (body?.code === "validation.failed" && Array.isArray(body.violations)) {
          title = t("errors.validation.title");
          content = body.violations
            .filter((issue) => issue && typeof issue.field === "string" && typeof issue.reason === "string")
            .map((issue, index) => `${index + 1}. ${formatValidationIssue(t, issue)}`)
            .join("\n");
        } else if (typeof body?.code === "string") {
          content = t(`errors.api.${body.code}`, body.params);
        }
        break;
      }
      case "NetworkError":
        content = t("errors.api.no-network");
        break;
      case "TimeoutError":
        content = t("errors.api.timeout");
        break;
    }
  }

  return { title, content: content || t("errors.unknown-error"), duration: 3500 };
}
