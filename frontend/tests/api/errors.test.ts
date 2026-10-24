import { expect, test } from "vitest";
import { ApiRequestError } from "@/api/errors";

test("preserves named error options", () => {
  const response = new Response(null, { status: 422, statusText: "Unprocessable Content" });
  const body = { code: "invalid" };
  const cause = new Error("Invalid field");

  const error = new ApiRequestError("ValidationError", "Invalid response", { response, body, cause });

  expect(error).toBeInstanceOf(Error);
  expect(error).toMatchObject({
    name: "ValidationError",
    message: "Invalid response",
    response,
    status: 422,
    statusText: "Unprocessable Content",
    body,
    cause,
    timeoutMs: 0,
  });
});

test("defaults error options", () => {
  const error = new ApiRequestError("NetworkError", "Offline");

  expect(error.response).toBeUndefined();
  expect(error.body).toBeUndefined();
  expect(error.cause).toBeUndefined();
  expect(error.status).toBeUndefined();
  expect(error.statusText).toBe("");
  expect(error.timeoutMs).toBe(0);
});

test("creates typed errors", () => {
  const response = new Response(null, { status: 503 });
  const body = "unavailable";
  const cause = new Error("Underlying failure");

  const http = ApiRequestError.http(response, { body, cause });
  const network = ApiRequestError.network(cause);
  const timeout = ApiRequestError.timeout(5_000, cause);
  const validation = ApiRequestError.validation("Invalid JSON response", { response, body, cause });

  expect(http).toMatchObject({
    name: "HttpError",
    message: "HTTP 503",
    response,
    body,
    cause,
  });
  expect(network).toMatchObject({
    name: "NetworkError",
    message: "Network request failed",
    cause,
  });
  expect(timeout).toMatchObject({
    name: "TimeoutError",
    message: "Request timed out",
    timeoutMs: 5_000,
    cause,
  });
  expect(validation).toMatchObject({
    name: "ValidationError",
    message: "Invalid JSON response",
    response,
    body,
    cause,
  });
});

test.each([
  [400, false],
  [401, false],
  [403, false],
  [422, false],
  [429, true],
  [499, false],
  [500, true],
  [503, true],
  [599, true],
])("HTTP %s transient: %s", (status, expected) => {
  const response = new Response(null, { status });

  const error = ApiRequestError.http(response);

  expect(error.isTransient).toBe(expected);
});

test("classifies non-HTTP errors", () => {
  const network = ApiRequestError.network();
  const timeout = ApiRequestError.timeout(5_000);
  const validation = ApiRequestError.validation("Invalid response");

  expect(network.isTransient).toBe(true);
  expect(timeout.isTransient).toBe(true);
  expect(validation.isTransient).toBe(false);
});
