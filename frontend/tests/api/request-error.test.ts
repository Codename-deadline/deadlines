import { expect, test, vi } from "vitest";
import { ApiRequestError } from "@/api/errors";
import { requestErrorNotification } from "@/utils/requestError";

const translate = (key: string) => key;

test.each([
  { error: ApiRequestError.network(), content: "errors.api.no-network" },
  { error: ApiRequestError.timeout(5_000), content: "errors.api.timeout" },
  { error: ApiRequestError.validation("Invalid JSON"), content: "errors.unknown-error" },
  { error: new Error("Unexpected"), content: "errors.unknown-error" },
])("formats $error.name", ({ error, content }) => {
  const notification = requestErrorNotification(error, translate);

  expect(notification).toMatchObject({ title: "errors.error", content });
});

test("ignores cancellation", () => {
  const error = new DOMException("Cancelled", "AbortError");

  const notification = requestErrorNotification(error, translate);

  expect(notification).toBeUndefined();
});

test("formats API error codes", () => {
  const error = ApiRequestError.http(new Response(null, { status: 409 }), { body: { code: "username.taken" } });

  const notification = requestErrorNotification(error, translate);

  expect(notification?.content).toBe("errors.api.username.taken");
});

test("formats field violations", () => {
  const error = ApiRequestError.http(new Response(null, { status: 422 }), {
    body: { code: "validation.failed", violations: [{ field: "username", reason: "length.min", min: 3 }] },
  });
  const t = vi.fn((key: string, _params?: Record<string, unknown>) => key);

  const notification = requestErrorNotification(error, t);

  expect(notification).toMatchObject({
    title: "errors.validation.title",
    content: "1. errors.validation.reasons.length.min",
  });
  expect(t).toHaveBeenCalledWith("errors.validation.reasons.length.min", {
    field: "errors.validation.fields.username",
    min: 3,
  });
});

test.each(["unavailable", null, { code: "unknown" }])("falls back for unrecognized bodies", (body) => {
  const error = ApiRequestError.http(new Response(null, { status: 503 }), { body });

  const notification = requestErrorNotification(error, (key) => (key === "errors.api.unknown" ? undefined : key));

  expect(notification?.content).toBe("errors.unknown-error");
});
