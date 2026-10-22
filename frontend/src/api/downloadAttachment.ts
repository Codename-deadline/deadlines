import { getGetAttachmentUrl } from "./generated/endpoints/attachments/attachments";

export class AttachmentDownloadError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(`Attachment download failed (${status})`);
    this.name = "AttachmentDownloadError";
  }
}

/** The API redirects to storage; the final body is binary, not the API's JSON response. */
export async function downloadAttachment(
  attachmentId: number,
  disposition: "attachment" | "inline" = "attachment",
  options: RequestInit = {},
  fetcher: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> = globalThis.fetch,
): Promise<Blob> {
  const response = await fetcher(getGetAttachmentUrl(attachmentId, { disposition }), {
    ...options,
    method: "GET",
    redirect: "follow",
  });
  if (!response.ok) {
    const text = await response.text();
    let body: unknown = text;
    try {
      body = JSON.parse(text);
    } catch {
      // Storage errors may be text/XML rather than the API's JSON error shape.
    }
    throw new AttachmentDownloadError(response.status, body);
  }
  return response.blob();
}
