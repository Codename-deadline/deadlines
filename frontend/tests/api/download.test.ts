import { once } from "node:events";
import { createServer, type RequestListener } from "node:http";
import type { AddressInfo } from "node:net";
import { createPinia, disposePinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, expect, onTestFinished, test, vi } from "vitest";
import { downloadAttachment } from "@/api/downloadAttachment";
import { useTokenStore } from "@/stores/TokenStore";

beforeEach(() => {
  const pinia = createPinia();
  setActivePinia(pinia);
  useTokenStore(pinia).updateTokens({ accessToken: "access", refreshToken: "refresh" });
  onTestFinished(() => disposePinia(pinia));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

async function startServer(handler: RequestListener) {
  const server = createServer(handler).listen(0, "127.0.0.1");
  onTestFinished(() => {
    server.close();
    server.closeAllConnections();
  });

  await once(server, "listening");
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

test("preserves bytes and strips cross-origin auth", async () => {
  const bytes = new Uint8Array([0, 1, 127, 255]);
  const received = { apiAuthorization: "", storageAuthorization: "", disposition: "" };

  const storage = await startServer((request, response) => {
    received.storageAuthorization = request.headers.authorization ?? "";
    response.writeHead(200, { "content-type": "application/octet-stream" }).end(bytes);
  });
  const api = await startServer((request, response) => {
    received.apiAuthorization = request.headers.authorization ?? "";
    received.disposition = new URL(request.url ?? "/", "http://localhost").searchParams.get("disposition") ?? "";
    response.writeHead(302, { location: `${storage}/file` }).end();
  });

  vi.stubEnv("VITE_API_BASE_URL", api);

  const blob = await downloadAttachment(99, "inline");

  expect(new Uint8Array(await blob.arrayBuffer())).toEqual(bytes);
  expect(blob.type).toBe("application/octet-stream");
  expect(received).toEqual({ apiAuthorization: "Bearer access", storageAuthorization: "", disposition: "inline" });
});

test.each([
  { format: "JSON", status: 404, body: { code: "not.found" } },
  { format: "text", status: 503, body: "storage unavailable" },
])("preserves $format download errors", async ({ status, body }) => {
  const fetcher = vi
    .fn()
    .mockImplementation(async () =>
      typeof body === "string" ? new Response(body, { status }) : Response.json(body, { status }),
    );
  vi.stubGlobal("fetch", fetcher);

  const pending = downloadAttachment(99);

  await expect(pending).rejects.toMatchObject({
    name: "HttpError",
    status,
    body,
  });
});

test("cancellation prevents the download request", async () => {
  const signal = AbortSignal.abort();
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);

  const result = downloadAttachment(99, "attachment", { signal });

  await expect(result).rejects.toBe(signal.reason);
  expect(fetcher).not.toHaveBeenCalled();
});
