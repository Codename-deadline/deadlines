import { once } from "node:events";
import { createServer, type RequestListener } from "node:http";
import type { AddressInfo } from "node:net";
import { expect, onTestFinished, test, vi } from "vitest";
import { downloadAttachment } from "@/api/downloadAttachment";

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

  const blob = await downloadAttachment(
    99,
    "inline",
    { headers: { Authorization: "Bearer access" } },
    (input, options) => fetch(new URL(String(input), api), options),
  );

  expect(new Uint8Array(await blob.arrayBuffer())).toEqual(bytes);
  expect(blob.type).toBe("application/octet-stream");
  expect(received).toEqual({ apiAuthorization: "Bearer access", storageAuthorization: "", disposition: "inline" });
});

test.each([
  { format: "JSON", status: 404, body: { code: "not.found" } },
  { format: "text", status: 503, body: "storage unavailable" },
])("preserves $format download errors", async ({ status, body }) => {
  const response = typeof body === "string" ? new Response(body, { status }) : Response.json(body, { status });
  const fetcher = vi.fn().mockResolvedValue(response);

  const pending = downloadAttachment(99, "attachment", {}, fetcher);

  await expect(pending).rejects.toMatchObject({
    name: "AttachmentDownloadError",
    status,
    body,
  });
});

test("forwards download cancellation", async () => {
  const signal = AbortSignal.abort();
  const error = new DOMException("Aborted", "AbortError");
  const fetcher = vi.fn().mockRejectedValue(error);

  const result = downloadAttachment(99, "attachment", { signal }, fetcher);

  await expect(result).rejects.toBe(error);
  expect(fetcher).toHaveBeenCalledWith(expect.any(String), { signal, redirect: "follow", method: "GET" });
});
